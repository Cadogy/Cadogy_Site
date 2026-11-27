import { z } from "zod"

import { fail, firstIssue, ok, type Result } from "@/lib/result"

import {
  normalizeUnit,
  PRICING_MODELS,
  resolveCatalogPrice,
} from "../domain/catalog"
import {
  allocatePayment,
  consolidateCharges,
  dueReminders,
  reminderKey,
} from "../domain/collections"
import { DAY_MS, startOfUtcDay } from "../domain/dates"
import {
  addByCurrency,
  formatDate,
  type AmountsByCurrency,
} from "../domain/format"
import { wasDelivered, type Invoice } from "../domain/invoice"
import { isPayable } from "../domain/lifecycle"
import {
  allowancePeriod,
  formatHours,
  inPeriod,
  MAX_INCLUDED_HOURS,
  MAX_LOGGED_HOURS,
  roundHours,
  splitHours,
  type AllowancePeriod,
} from "../domain/packages"
import {
  ADD_ON_STATUSES,
  addInterval,
  BILLING_INTERVALS,
  dueCharges,
  type AddOnStatus,
} from "../domain/recurring"
import {
  CURRENCIES,
  lineQuantity,
  minorUnits,
  wholeQuantity,
  type Currency,
} from "../domain/schema"
import { calculateInvoiceTotals, sum } from "../domain/totals"
import type { createBillingService } from "./billing-service"
import type {
  BillingSettings,
  CatalogCategory,
  CatalogItem,
  Charge,
  EngineRepository,
  PaymentGateway,
  PricedCatalogItem,
  RunSummary,
  StoredAddOn,
  TimeEntry,
} from "./engine-ports"

type Dependencies = {
  readonly billing: ReturnType<typeof createBillingService>
  readonly repository: EngineRepository
  readonly gateway: PaymentGateway
  readonly clock: () => Date
  readonly applyCredit?: (
    invoiceId: string,
    actorId: string
  ) => Promise<unknown>
}

export type AutopayOutcome = "skipped" | "collected" | "failed"

export type LoggedTime = {
  readonly entry: TimeEntry
  /** The plan whose hours covered some of it, if any. */
  readonly planName: string | null
}

export type PlanAllowance = {
  readonly addOnId: string
  readonly name: string
  readonly period: AllowancePeriod
  readonly allowance: number
  readonly used: number
  readonly remaining: number
}

/** "1.5 h covered by Business Care; 0.5 h added to the next invoice." */
export const loggedTimeMessage = ({ entry, planName }: LoggedTime) => {
  const covered =
    entry.includedHours > 0
      ? `${formatHours(entry.includedHours)} covered by ${planName ?? "the plan"}`
      : ""
  const billed =
    entry.billedHours > 0
      ? `${formatHours(entry.billedHours)} added to the next invoice`
      : ""
  const text = [covered, billed].filter(Boolean).join("; ")
  return `Time logged. ${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}

export type IssuedInvoice = {
  readonly invoice: Invoice
  /** False when the "issued" email could not be delivered. */
  readonly emailed: boolean
  readonly autopay: AutopayOutcome
}

const SYSTEM = "system"
const MAX_AUTOPAY_ATTEMPTS = 3
const AUTOPAY_RETRY_DAYS = 3
export const NO_HOURLY_RATE =
  "This hourly service has no rate. Set one on the service, its category, or in Billing settings."
const MONTHS_PER_INTERVAL = { month: 1, quarter: 3, year: 12 } as const

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date")

const moneySchema = z.object({
  amount: minorUnits.positive(),
  currency: z.enum(CURRENCIES),
})

/** Hours with at most two decimals, e.g. 0.25 or 1.5. */
const hoursSchema = (max: number) =>
  z
    .number()
    .positive("Enter more than 0 hours")
    .max(max, `Enter at most ${max} hours`)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      message: "Use at most two decimal places for hours",
    })

const catalogItemSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500).default(""),
    categoryId: z.string().min(1).nullable().default(null),
    pricing: z.enum(PRICING_MODELS).default("fixed"),
    unitAmount: minorUnits.nullable().default(null),
    unit: z.string().max(40).nullable().default(null).transform(normalizeUnit),
    priceFrom: z.boolean().default(false),
    includedItemIds: z
      .array(z.string().min(1))
      .max(200)
      .default([])
      .transform((ids) => [...new Set(ids)]),
    includedHours: hoursSchema(MAX_INCLUDED_HOURS).nullable().default(null),
    currency: z.enum(CURRENCIES).default("USD"),
    interval: z.enum(BILLING_INTERVALS),
  })
  .refine(
    (item) => item.includedHours === null || item.interval !== "one_time",
    {
      message:
        "Included hours renew each period, so the service needs a recurring billing schedule",
      path: ["includedHours"],
    }
  )
  .refine((item) => item.pricing !== "fixed" || item.unitAmount !== null, {
    message: "Enter a price for fixed-price services",
    path: ["unitAmount"],
  })

const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  hourlyRate: moneySchema.nullable().default(null),
})

const addOnSchema = z.object({
  catalogItemId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  unitAmount: minorUnits.positive().optional(),
  interval: z.enum(BILLING_INTERVALS).optional(),
  quantity: wholeQuantity.default(1),
  startDate: isoDate.optional(),
})

const chargeSchema = z.object({
  description: z.string().trim().min(1).max(500),
  unitAmount: minorUnits.positive(),
  quantity: wholeQuantity.default(1),
})

// Logged time bills fractional hours.
const hourChargeSchema = chargeSchema.extend({ quantity: lineQuantity })

const timeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date"),
  hours: hoursSchema(MAX_LOGGED_HOURS),
  description: z.string().trim().min(1, "Say what the work was").max(300),
  catalogItemId: z.string().min(1).optional(),
  unitAmount: minorUnits.positive().optional(),
  billSeparately: z.boolean().default(false),
})

const addOnChangesSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  unitAmount: minorUnits.positive().optional(),
  quantity: wholeQuantity.optional(),
  interval: z.enum(BILLING_INTERVALS).optional(),
  nextBillingDate: isoDate.optional(),
  includedHours: hoursSchema(MAX_INCLUDED_HOURS).nullable().optional(),
})

const settingsSchema = z.object({
  paymentInstructions: z.string().trim().max(2_000),
  defaultTaxRateBps: z.number().int().min(0).max(10_000),
  reminderOffsets: z.array(z.number().int().min(-60).max(120)).max(8),
  autoBillEnabled: z.boolean(),
  defaultHourlyRate: moneySchema.nullable().default(null),
})

const parseDay = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

const amountDue = (invoice: Invoice) =>
  calculateInvoiceTotals(invoice).amountDue

const skipPausedPeriods = (addOn: StoredAddOn, today: Date): Date => {
  if (addOn.interval === "one_time") return addOn.nextBillingDate
  const interval = addOn.interval
  const floor = startOfUtcDay(today).getTime()
  const advance = (date: Date): Date =>
    date.getTime() >= floor
      ? date
      : advance(addInterval(date, interval, addOn.anchorDay))
  return advance(addOn.nextBillingDate)
}

const ALLOWED_TRANSITIONS: Record<AddOnStatus, readonly AddOnStatus[]> = {
  active: ["paused", "canceled"],
  paused: ["active", "canceled"],
  canceled: [],
  completed: [],
}

export const createBillingEngine = ({
  billing,
  repository,
  gateway,
  clock,
  applyCredit,
}: Dependencies) => {
  const creditFirst = async (invoice: Invoice, actorId: string) => {
    if (!applyCredit) return invoice
    await applyCredit(invoice.id, actorId)
    return (await billing.getInvoice(invoice.id)) ?? invoice
  }

  const parseCatalogItem = async (input: unknown, selfId?: string) => {
    const parsed = catalogItemSchema.safeParse(input)
    if (!parsed.success) return fail<never>(firstIssue(parsed.error))
    if (
      parsed.data.categoryId &&
      !(await repository.categories.find(parsed.data.categoryId))
    )
      return fail<never>("Category not found")
    const includedItemIds = parsed.data.includedItemIds.filter(
      (id) => id !== selfId
    )
    if (includedItemIds.length > 0) {
      const known = new Set(
        (await repository.catalog.list({ includeArchived: true })).map(
          (item) => item.id
        )
      )
      if (includedItemIds.some((id) => !known.has(id)))
        return fail<never>("An included service is no longer in the catalog")
    }
    return ok({ ...parsed.data, includedItemIds })
  }

  const createCatalogItem = async (
    input: unknown
  ): Promise<Result<CatalogItem>> => {
    const parsed = await parseCatalogItem(input)
    if (!parsed.ok) return parsed
    return ok(
      await repository.catalog.insert({ ...parsed.value, archived: false })
    )
  }

  const updateCatalogItem = async (
    id: string,
    input: unknown
  ): Promise<Result<CatalogItem>> => {
    const existing = await repository.catalog.find(id)
    if (!existing) return fail("Catalog item not found")
    const parsed = await parseCatalogItem(input, id)
    if (!parsed.ok) return parsed
    return ok(await repository.catalog.save({ ...existing, ...parsed.value }))
  }

  const createCategory = async (
    input: unknown
  ): Promise<Result<CatalogCategory>> => {
    const parsed = categorySchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(await repository.categories.insert(parsed.data))
  }

  const updateCategory = async (
    id: string,
    input: unknown
  ): Promise<Result<CatalogCategory>> => {
    const existing = await repository.categories.find(id)
    if (!existing) return fail("Category not found")
    const parsed = categorySchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(await repository.categories.save({ ...existing, ...parsed.data }))
  }

  /** Deleting a category keeps its services; they become uncategorized. */
  const deleteCategory = async (id: string): Promise<Result<null>> => {
    if (!(await repository.categories.find(id)))
      return fail("Category not found")
    const items = await repository.catalog.list({ includeArchived: true })
    await Promise.all(
      items
        .filter((item) => item.categoryId === id)
        .map((item) => repository.catalog.save({ ...item, categoryId: null }))
    )
    await repository.categories.remove(id)
    return ok(null)
  }

  const priceItems = (
    items: readonly CatalogItem[],
    categories: readonly CatalogCategory[],
    settings: BillingSettings
  ): PricedCatalogItem[] =>
    items.map((item) => {
      const category =
        categories.find((candidate) => candidate.id === item.categoryId) ?? null
      return {
        ...item,
        category,
        price: resolveCatalogPrice(
          item,
          category?.hourlyRate ?? null,
          settings.defaultHourlyRate
        ),
      }
    })

  const pricedCatalog = async (options: { includeArchived: boolean }) => {
    const [items, categories, settings] = await Promise.all([
      repository.catalog.list(options),
      repository.categories.list(),
      repository.settings.get(),
    ])
    return { items: priceItems(items, categories, settings), categories }
  }

  const priceOf = async (item: CatalogItem) => {
    const [categories, settings] = await Promise.all([
      repository.categories.list(),
      repository.settings.get(),
    ])
    const [priced] = priceItems([item], categories, settings)
    return priced?.price ?? null
  }

  const setCatalogItemArchived = async (
    id: string,
    archived: boolean
  ): Promise<Result<CatalogItem>> => {
    const existing = await repository.catalog.find(id)
    if (!existing) return fail("Catalog item not found")
    return ok(await repository.catalog.save({ ...existing, archived }))
  }

  const addAddOn = async (
    clientId: string,
    input: unknown
  ): Promise<Result<StoredAddOn>> => {
    const client = await billing.getClient(clientId)
    if (!client) return fail("Client not found")
    const parsed = addOnSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))

    const item = parsed.data.catalogItemId
      ? await repository.catalog.find(parsed.data.catalogItemId)
      : null
    if (parsed.data.catalogItemId && !item)
      return fail("Catalog item not found")

    const name = parsed.data.name ?? item?.name
    const unitAmount =
      parsed.data.unitAmount ??
      (item ? (await priceOf(item))?.unitAmount : null)
    const interval = parsed.data.interval ?? item?.interval
    if (item && item.currency !== client.currency)
      return fail(
        `${item.name} is priced in ${item.currency}, but this client is billed in ${client.currency}. Add it as a custom service in ${client.currency} instead.`
      )
    if (item?.pricing === "hourly" && !unitAmount) return fail(NO_HOURLY_RATE)
    if (item?.pricing === "at_cost" && !unitAmount)
      return fail(`${item.name} is billed at cost. Enter what it costs.`)
    if (!name || !unitAmount || !interval)
      return fail("Name, price and billing interval are required")

    const startDate = parsed.data.startDate
      ? parseDay(parsed.data.startDate)
      : startOfUtcDay(clock())
    return ok(
      await repository.addOns.insert({
        clientId,
        catalogItemId: item?.id ?? null,
        name,
        unitAmount,
        quantity: parsed.data.quantity,
        currency: item?.currency ?? client.currency,
        interval,
        anchorDay: startDate.getUTCDate(),
        startDate,
        nextBillingDate: startDate,
        status: "active",
        canceledAt: null,
        includedHours:
          item && item.interval !== "one_time" && interval !== "one_time"
            ? item.includedHours
            : null,
      })
    )
  }

  /**
   * Renames, re-prices or reschedules a service. Price and quantity apply from
   * the next renewal; a new next-billing date becomes the renewal anchor.
   */
  const updateAddOn = async (
    id: string,
    input: unknown
  ): Promise<Result<StoredAddOn>> => {
    const existing = await repository.addOns.find(id)
    if (!existing) return fail("Service not found")
    if (existing.status === "canceled" || existing.status === "completed")
      return fail(`A ${existing.status} service can't be changed`)
    const parsed = addOnChangesSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    const changes = parsed.data
    const nextBillingDate = changes.nextBillingDate
      ? parseDay(changes.nextBillingDate)
      : existing.nextBillingDate
    if (
      changes.nextBillingDate &&
      nextBillingDate.getTime() < startOfUtcDay(clock()).getTime()
    )
      return fail("The next billing date can't be in the past")
    return ok(
      await repository.addOns.save({
        ...existing,
        name: changes.name ?? existing.name,
        unitAmount: changes.unitAmount ?? existing.unitAmount,
        quantity: changes.quantity ?? existing.quantity,
        interval: changes.interval ?? existing.interval,
        includedHours:
          changes.includedHours === undefined
            ? existing.includedHours
            : changes.includedHours,
        nextBillingDate,
        anchorDay: changes.nextBillingDate
          ? nextBillingDate.getUTCDate()
          : existing.anchorDay,
      })
    )
  }

  const setAddOnStatus = async (
    id: string,
    status: AddOnStatus
  ): Promise<Result<StoredAddOn>> => {
    const existing = await repository.addOns.find(id)
    if (!existing) return fail("Service not found")
    if (
      !ADD_ON_STATUSES.includes(status) ||
      !ALLOWED_TRANSITIONS[existing.status].includes(status)
    ) {
      return fail(`A ${existing.status} service can't be set to ${status}`)
    }
    const now = clock()
    return ok(
      await repository.addOns.save({
        ...existing,
        status,
        canceledAt: status === "canceled" ? now : existing.canceledAt,
        nextBillingDate:
          existing.status === "paused" && status === "active"
            ? skipPausedPeriods(existing, now)
            : existing.nextBillingDate,
      })
    )
  }

  const addCharge = async (
    clientId: string,
    input: unknown
  ): Promise<Result<Charge>> => {
    const client = await billing.getClient(clientId)
    if (!client) return fail("Client not found")
    const parsed = chargeSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    const charge = await repository.charges.insertIfNew({
      ...parsed.data,
      clientId,
      addOnId: null,
      unit: null,
      currency: client.currency,
      periodStart: null,
      periodEnd: null,
      status: "pending",
      invoiceId: null,
      createdAt: clock(),
    })
    return charge ? ok(charge) : fail("Charge could not be added")
  }

  const updateCharge = async (
    id: string,
    input: unknown
  ): Promise<Result<Charge>> => {
    const [charge] = await repository.charges.list({ ids: [id] })
    if (!charge) return fail("Charge not found")
    if (charge.status !== "pending")
      return fail("Only pending charges can be edited")
    const parsed = (
      charge.unit === "hour" ? hourChargeSchema : chargeSchema
    ).safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(await repository.charges.save({ ...charge, ...parsed.data }))
  }

  const voidCharge = async (id: string): Promise<Result<Charge>> => {
    const [charge] = await repository.charges.list({ ids: [id] })
    if (!charge) return fail("Charge not found")
    if (charge.status !== "pending")
      return fail("Only pending charges can be removed")
    return ok(await repository.charges.save({ ...charge, status: "void" }))
  }

  const pendingCharges = (clientId: string) =>
    repository.charges.list({ clientId, status: "pending" })

  const collectWithSavedCard = async (
    invoice: Invoice
  ): Promise<AutopayOutcome> => {
    const client = await billing.getClient(invoice.clientId)
    const card = client?.autopay.enabled ? client.autopay.card : null
    const owed = amountDue(invoice)
    if (!card || owed === 0 || invoice.status !== "open") return "skipped"

    const result = await gateway.chargeSavedCard({
      customerId: card.stripeCustomerId,
      paymentMethodId: card.paymentMethodId,
      amount: owed,
      currency: invoice.currency,
      invoiceId: invoice.id,
      description: `Invoice ${invoice.number ?? invoice.id}`,
    })
    if (!result.ok) {
      await billing.notifyAutopayFailed(invoice.id, result.error)
      return "failed"
    }
    await billing.recordStripePayment({
      invoiceId: invoice.id,
      amount: owed,
      eventId: `autopay:${result.paymentId}`,
      paymentIntentId: result.paymentId,
      paidAt: clock(),
    })
    return "collected"
  }

  /**
   * The one way an invoice gets issued: number it, use up any credit balance,
   * email it (showing what's left to pay), then charge the saved card if the
   * client has autopay on. Used by the editor, "Bill now" and the daily run.
   */
  const issueAndCollect = async (
    invoiceId: string,
    actorId: string
  ): Promise<Result<IssuedInvoice>> => {
    const issued = await billing.issue(invoiceId, actorId, {
      beforeNotify: (invoice) => creditFirst(invoice, actorId),
    })
    if (!issued.ok) return issued
    const emailed = wasDelivered(issued.value, "sent")
    const autopay = await collectWithSavedCard(issued.value)
    const invoice =
      autopay === "skipped"
        ? issued.value
        : ((await billing.getInvoice(invoiceId)) ?? issued.value)
    return ok({ invoice, emailed, autopay })
  }

  /** Lets staff retry the saved card on an open invoice right away. */
  const chargeSavedCard = async (
    invoiceId: string
  ): Promise<Result<AutopayOutcome>> => {
    const invoice = await billing.getInvoice(invoiceId)
    if (!invoice) return fail("Invoice not found")
    if (invoice.status !== "open")
      return fail("Only open invoices can be charged")
    const outcome = await collectWithSavedCard(invoice)
    if (outcome === "skipped")
      return fail("This client has no saved card with autopay on")
    return ok(outcome)
  }

  const isDisputed = (invoice: Invoice) =>
    invoice.events.filter((event) => event.type === "disputed").length >
    invoice.events.filter((event) => event.type === "dispute_closed").length

  /** Retries failed autopay a few days apart, up to a fixed number of tries. */
  const retryFailedAutopay = async (today: Date, skip: ReadonlySet<string>) => {
    const open = await billing.listInvoices({ status: "open" })
    const due = open.filter((invoice) => {
      if (skip.has(invoice.id) || isDisputed(invoice)) return false
      const failures = invoice.events.filter(
        (event) => event.type === "autopay_failed"
      )
      const last = failures.at(-1)
      return (
        last !== undefined &&
        failures.length < MAX_AUTOPAY_ATTEMPTS &&
        today.getTime() - last.at.getTime() >= AUTOPAY_RETRY_DAYS * DAY_MS
      )
    })
    return Promise.all(due.map(collectWithSavedCard))
  }

  const invoiceCharges = async (
    clientId: string,
    chargeIds: readonly string[] | "all",
    actorId: string
  ): Promise<Result<IssuedInvoice[]>> => {
    const pending = await pendingCharges(clientId)
    const selected =
      chargeIds === "all"
        ? pending
        : pending.filter((charge) => chargeIds.includes(charge.id))
    if (selected.length === 0) return fail("No pending charges selected")
    if (chargeIds !== "all" && selected.length !== chargeIds.length) {
      return fail("Some charges are no longer pending")
    }

    const settings = await repository.settings.get()
    const issued = await consolidateCharges(selected).reduce<
      Promise<Result<IssuedInvoice[]>>
    >(
      async (previous, group) => {
        const acc = await previous
        if (!acc.ok) return acc
        const draft = await billing.createDraft(
          {
            clientId,
            currency: group.currency,
            lineItems: [...group.lineItems],
            taxRateBps: settings.defaultTaxRateBps,
            memo: settings.paymentInstructions,
          },
          actorId
        )
        if (!draft.ok) return draft
        // Mark the charges billed before collecting, so a slow card charge
        // can never leave them pending and billed twice.
        const groupCharges = selected.filter((charge) =>
          group.chargeIds.includes(charge.id)
        )
        await Promise.all(
          groupCharges.map((charge) =>
            repository.charges.save({
              ...charge,
              status: "invoiced",
              invoiceId: draft.value.id,
            })
          )
        )
        const issuedInvoice = await issueAndCollect(draft.value.id, actorId)
        if (!issuedInvoice.ok) {
          // Issuing failed, so put the charges back and drop the empty draft.
          await Promise.all(groupCharges.map(repository.charges.save))
          await billing.deleteDraft(draft.value.id)
          return issuedInvoice
        }
        return ok([...acc.value, issuedInvoice.value])
      },
      Promise.resolve(ok([]))
    )
    return issued
  }

  const archivedClientIds = async (clientIds: readonly string[]) => {
    const unique = [...new Set(clientIds)]
    const clients = await Promise.all(unique.map((id) => billing.getClient(id)))
    return new Set(
      clients.flatMap((client) => (client?.archivedAt ? [client.id] : []))
    )
  }

  const generateCharges = async (today: Date) => {
    const listed = await repository.addOns.list({ dueBy: today })
    const archived = await archivedClientIds(
      listed.map((addOn) => addOn.clientId)
    )
    const due = listed.filter((addOn) => !archived.has(addOn.clientId))
    const created = await Promise.all(
      due.map(async (addOn) => {
        const result = dueCharges(addOn, today)
        const inserted = await Promise.all(
          result.charges.map((charge) =>
            repository.charges.insertIfNew({
              ...charge,
              unit: null,
              status: "pending",
              invoiceId: null,
              createdAt: today,
            })
          )
        )
        await repository.addOns.save({
          ...addOn,
          nextBillingDate: result.nextBillingDate,
          status: result.completed ? "completed" : addOn.status,
        })
        return inserted.filter((charge) => charge !== null).length
      })
    )
    return sum(created)
  }

  const autoBill = async (settings: BillingSettings) => {
    if (!settings.autoBillEnabled)
      return { invoices: [] as IssuedInvoice[], errors: [] as string[] }
    const pending = await repository.charges.list({ status: "pending" })
    const clientIds = [...new Set(pending.map((charge) => charge.clientId))]
    const results = await Promise.all(
      clientIds.map(async (clientId) => {
        const client = await billing.getClient(clientId)
        if (!client?.autoBill || client.archivedAt)
          return ok<IssuedInvoice[]>([])
        return invoiceCharges(clientId, "all", SYSTEM)
      })
    )
    return {
      invoices: results.flatMap((result) => (result.ok ? result.value : [])),
      errors: results.flatMap((result) => (result.ok ? [] : [result.error])),
    }
  }

  const sendScheduledReminders = async (
    settings: BillingSettings,
    today: Date,
    skip: ReadonlySet<string>
  ) => {
    const open = await billing.listInvoices({ status: "open" })
    const archived = await archivedClientIds(
      open.map((invoice) => invoice.clientId)
    )
    const sent = await Promise.all(
      open
        .filter(
          (invoice) => !skip.has(invoice.id) && !archived.has(invoice.clientId)
        )
        .flatMap((invoice) =>
          dueReminders(invoice, today, settings.reminderOffsets).map((offset) =>
            billing.sendReminder(invoice.id, SYSTEM, reminderKey(offset))
          )
        )
    )
    return sent.filter((result) => result.ok).length
  }

  const runBilling = async (): Promise<RunSummary> => {
    const today = clock()
    const settings = await repository.settings.get()
    const chargesCreated = await generateCharges(today)
    const billed = await autoBill(settings)
    const billedIds = new Set(billed.invoices.map(({ invoice }) => invoice.id))
    const retried = await retryFailedAutopay(today, billedIds)
    const autopay = [
      ...billed.invoices.map((issued) => issued.autopay),
      ...retried,
    ]
    const remindersSent = await sendScheduledReminders(
      settings,
      today,
      billedIds
    )
    const summary: RunSummary = {
      at: today,
      chargesCreated,
      invoicesIssued: billed.invoices.length,
      autopayCollected: autopay.filter((outcome) => outcome === "collected")
        .length,
      autopayFailed: autopay.filter((outcome) => outcome === "failed").length,
      remindersSent,
      errors: billed.errors,
    }
    await repository.runs.record(summary)
    return summary
  }

  const preparePayment = async (
    email: string,
    invoiceIds: readonly string[]
  ): Promise<
    Result<{ invoiceIds: string[]; amount: number; currency: Currency }>
  > => {
    const unique = [...new Set(invoiceIds)]
    if (unique.length === 0) return fail("Select at least one invoice")
    const owned = await billing.listForPortalUser(email)
    const selected = owned.filter(
      (invoice) => unique.includes(invoice.id) && isPayable(invoice)
    )
    if (selected.length !== unique.length)
      return fail("Some invoices can't be paid online")
    const currencies = new Set(selected.map((invoice) => invoice.currency))
    const [currency] = [...currencies]
    if (!currency || currencies.size > 1)
      return fail("Pay invoices in different currencies separately")
    const amount = sum(selected.map(amountDue))
    if (amount === 0) return fail("Nothing is due on these invoices")
    return ok({
      invoiceIds: selected.map((invoice) => invoice.id),
      amount,
      currency,
    })
  }

  const applyBatchPayment = async (payment: {
    readonly invoiceIds: readonly string[]
    readonly amount: number
    readonly eventId: string
    readonly paidAt: Date
    readonly paymentIntentId?: string
  }): Promise<
    Result<{
      allocations: { invoiceId: string; amount: number }[]
      unallocated: number
    }>
  > => {
    const invoices = await Promise.all(
      payment.invoiceIds.map((id) => billing.getInvoice(id))
    )
    const open = invoices.filter(
      (invoice): invoice is Invoice => invoice != null && isPayable(invoice)
    )
    const allocation = allocatePayment(open, payment.amount)
    const results = await Promise.all(
      allocation.allocations.map((entry) =>
        billing.recordStripePayment({
          invoiceId: entry.invoiceId,
          amount: entry.amount,
          eventId: `${payment.eventId}:${entry.invoiceId}`,
          paymentIntentId: payment.paymentIntentId,
          paidAt: payment.paidAt,
        })
      )
    )
    const failure = results.find((result) => !result.ok)
    if (failure && !failure.ok) return fail(failure.error)
    return ok(allocation)
  }

  const saveSettings = async (
    input: unknown
  ): Promise<Result<BillingSettings>> => {
    const parsed = settingsSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(await repository.settings.save(parsed.data))
  }

  const monthlyRecurringRevenue = async () => {
    const addOns = await repository.addOns.list({})
    return addOns.reduce<AmountsByCurrency>((totals, addOn) => {
      if (addOn.status !== "active" || addOn.interval === "one_time")
        return totals
      const monthly = Math.round(
        (addOn.unitAmount * addOn.quantity) /
          MONTHS_PER_INTERVAL[addOn.interval]
      )
      return addByCurrency(totals, addOn.currency, monthly)
    }, {})
  }

  const upcomingRenewals = async (days: number) => {
    const until = new Date(clock().getTime() + days * DAY_MS)
    const addOns = await repository.addOns.list({ dueBy: until })
    return addOns
      .filter((addOn) => addOn.status === "active")
      .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime())
  }

  /** Archiving pauses every live service, so nothing bills in the meantime. */
  const planAllowances = (
    plans: readonly StoredAddOn[],
    entries: readonly TimeEntry[],
    on: Date
  ) =>
    plans.flatMap((plan) => {
      if (plan.status !== "active" || !plan.includedHours) return []
      const period = allowancePeriod(plan, on)
      if (!period) return []
      const used = sum(
        entries
          .filter(
            (entry) => entry.addOnId === plan.id && inPeriod(period, entry.date)
          )
          .map((entry) => entry.includedHours)
      )
      const allowance = roundHours(plan.includedHours * plan.quantity)
      return [
        {
          addOnId: plan.id,
          name: plan.name,
          period,
          allowance,
          used: roundHours(used),
          remaining: roundHours(Math.max(0, allowance - used)),
        },
      ]
    })

  const hourlyRate = async (
    item: CatalogItem | null,
    currency: Currency,
    typed: number | undefined
  ) => {
    if (typed) return typed
    if (item) return (await priceOf(item))?.unitAmount ?? null
    const { defaultHourlyRate } = await repository.settings.get()
    return defaultHourlyRate?.currency === currency
      ? defaultHourlyRate.amount
      : null
  }

  /**
   * Logs work for a client. Hours come out of an active plan's allowance for
   * the period the work falls in; whatever the plan doesn't cover becomes a
   * pending charge at the hourly rate.
   */
  const logTime = async (
    clientId: string,
    input: unknown
  ): Promise<Result<LoggedTime>> => {
    const client = await billing.getClient(clientId)
    if (!client) return fail("Client not found")
    if (client.archivedAt) return fail("Restore the client before logging time")
    const parsed = timeEntrySchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    const data = parsed.data
    const date = parseDay(data.date)
    if (date.getTime() > startOfUtcDay(clock()).getTime())
      return fail("Time can't be logged for a future date")

    const item = data.catalogItemId
      ? await repository.catalog.find(data.catalogItemId)
      : null
    if (data.catalogItemId && !item) return fail("Catalog item not found")
    if (item && item.pricing !== "hourly")
      return fail(`${item.name} isn't an hourly service`)
    if (item && item.currency !== client.currency)
      return fail(
        `${item.name} is priced in ${item.currency}, but this client is billed in ${client.currency}`
      )

    const [plans, entries] = await Promise.all([
      data.billSeparately
        ? Promise.resolve([])
        : repository.addOns.list({ clientIds: [clientId] }),
      repository.timeEntries.list({ clientId }),
    ])
    const plan = planAllowances(
      plans.filter((candidate) => candidate.currency === client.currency),
      entries,
      date
    ).find((allowance) => allowance.remaining > 0)
    const { included, overage } = splitHours(data.hours, plan?.remaining ?? 0)
    const rate = await hourlyRate(item, client.currency, data.unitAmount)
    if (overage > 0 && !rate)
      return fail(
        "These hours are billable but there's no rate. Pick an hourly service or enter a rate."
      )

    const label = item ? `${item.name}: ${data.description}` : data.description
    const charge =
      overage > 0 && rate
        ? await repository.charges.insertIfNew({
            clientId,
            addOnId: null,
            description: `${label} (${formatDate(date)}${
              included > 0 ? `, beyond ${plan?.name ?? "plan"} hours` : ""
            })`.slice(0, 500),
            quantity: overage,
            unit: "hour",
            unitAmount: rate,
            currency: client.currency,
            periodStart: null,
            periodEnd: null,
            status: "pending",
            invoiceId: null,
            createdAt: clock(),
          })
        : null
    const entry = await repository.timeEntries.insert({
      clientId,
      date,
      hours: data.hours,
      description: data.description,
      catalogItemId: item?.id ?? null,
      addOnId: included > 0 ? (plan?.addOnId ?? null) : null,
      includedHours: included,
      billedHours: overage,
      unitAmount: overage > 0 ? rate : null,
      currency: client.currency,
      chargeId: charge?.id ?? null,
      createdAt: clock(),
    })
    return ok({ entry, planName: included > 0 ? (plan?.name ?? null) : null })
  }

  const removeTimeEntry = async (id: string): Promise<Result<null>> => {
    const entry = await repository.timeEntries.find(id)
    if (!entry) return fail("Time entry not found")
    if (entry.chargeId) {
      const [charge] = await repository.charges.list({ ids: [entry.chargeId] })
      if (charge?.status === "invoiced")
        return fail(
          "These hours are already on an invoice. Adjust that invoice instead."
        )
      if (charge?.status === "pending")
        await repository.charges.save({ ...charge, status: "void" })
    }
    await repository.timeEntries.remove(id)
    return ok(null)
  }

  /** Each active plan's hours this period, and the latest logged time. */
  const hoursOverview = async (clientId: string) => {
    const [plans, entries] = await Promise.all([
      repository.addOns.list({ clientIds: [clientId] }),
      repository.timeEntries.list({ clientId }),
    ])
    return {
      allowances: planAllowances(plans, entries, clock()),
      entries: entries.slice(0, 30),
    }
  }

  const archiveClient = async (clientId: string) => {
    const archived = await billing.archiveClient(clientId)
    if (!archived.ok) return archived
    const addOns = await repository.addOns.list({ clientIds: [clientId] })
    await Promise.all(
      addOns
        .filter((addOn) => addOn.status === "active")
        .map((addOn) => repository.addOns.save({ ...addOn, status: "paused" }))
    )
    return archived
  }

  return {
    archiveClient,
    restoreClient: billing.restoreClient,
    issueAndCollect,
    chargeSavedCard,
    updateCharge,
    listCatalog: repository.catalog.list,
    pricedCatalog,
    listCategories: repository.categories.list,
    createCategory,
    updateCategory,
    deleteCategory,
    createCatalogItem,
    updateCatalogItem,
    archiveCatalogItem: (id: string) => setCatalogItemArchived(id, true),
    restoreCatalogItem: (id: string) => setCatalogItemArchived(id, false),
    listAddOns: (clientId: string) =>
      repository.addOns.list({ clientIds: [clientId] }),
    addAddOn,
    updateAddOn,
    setAddOnStatus,
    addCharge,
    voidCharge,
    pendingCharges,
    invoiceCharges,
    runBilling,
    lastRun: repository.runs.latest,
    preparePayment,
    applyBatchPayment,
    getSettings: repository.settings.get,
    saveSettings,
    logTime,
    removeTimeEntry,
    hoursOverview,
    monthlyRecurringRevenue,
    upcomingRenewals,
  }
}
