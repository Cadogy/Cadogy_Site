import { z } from "zod"

import {
  allocatePayment,
  consolidateCharges,
  dueReminders,
  reminderKey,
} from "../domain/collections"
import { fail, ok, type Invoice, type Result } from "../domain/invoice"
import {
  ADD_ON_STATUSES,
  addInterval,
  BILLING_INTERVALS,
  dueCharges,
  type AddOnStatus,
} from "../domain/recurring"
import { CURRENCIES, type Currency } from "../domain/schema"
import { calculateInvoiceTotals } from "../domain/totals"
import type { createBillingService } from "./billing-service"
import type {
  BillingSettings,
  CatalogItem,
  Charge,
  EngineRepository,
  PaymentGateway,
  RunSummary,
  StoredAddOn,
} from "./engine-ports"

type Dependencies = {
  readonly billing: ReturnType<typeof createBillingService>
  readonly repository: EngineRepository
  readonly gateway: PaymentGateway
  readonly clock: () => Date
}

const SYSTEM = "system"
const DAY_MS = 86_400_000
const MONTHS_PER_INTERVAL = { month: 1, quarter: 3, year: 12 } as const

const minorUnits = z.number().int().nonnegative().max(1_000_000_000_00)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date")

const catalogItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).default(""),
  unitAmount: minorUnits,
  currency: z.enum(CURRENCIES).default("USD"),
  interval: z.enum(BILLING_INTERVALS),
})

const addOnSchema = z.object({
  catalogItemId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  unitAmount: minorUnits.positive().optional(),
  interval: z.enum(BILLING_INTERVALS).optional(),
  quantity: z.number().int().positive().max(10_000).default(1),
  startDate: isoDate.optional(),
})

const chargeSchema = z.object({
  description: z.string().trim().min(1).max(500),
  unitAmount: minorUnits.positive(),
  quantity: z.number().int().positive().max(10_000).default(1),
})

const settingsSchema = z.object({
  paymentInstructions: z.string().trim().max(2_000),
  defaultTaxRateBps: z.number().int().min(0).max(10_000),
  reminderOffsets: z.array(z.number().int().min(-60).max(120)).max(8),
  autoBillEnabled: z.boolean(),
})

const firstIssue = (error: { issues: readonly { message: string }[] }) =>
  error.issues[0]?.message ?? "Invalid input"

const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )

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
}: Dependencies) => {
  const createCatalogItem = async (
    input: unknown
  ): Promise<Result<CatalogItem>> => {
    const parsed = catalogItemSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(
      await repository.catalog.insert({ ...parsed.data, archived: false })
    )
  }

  const updateCatalogItem = async (
    id: string,
    input: unknown
  ): Promise<Result<CatalogItem>> => {
    const existing = await repository.catalog.find(id)
    if (!existing) return fail("Catalog item not found")
    const parsed = catalogItemSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(await repository.catalog.save({ ...existing, ...parsed.data }))
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
    const unitAmount = parsed.data.unitAmount ?? item?.unitAmount
    const interval = parsed.data.interval ?? item?.interval
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
      })
    )
  }

  const updateAddOn = async (
    id: string,
    input: {
      readonly quantity?: number
      readonly unitAmount?: number
      readonly name?: string
    }
  ): Promise<Result<StoredAddOn>> => {
    const existing = await repository.addOns.find(id)
    if (!existing) return fail("Service not found")
    const parsed = addOnSchema
      .pick({ name: true, unitAmount: true })
      .extend({
        quantity: z.number().int().positive().max(10_000).optional(),
      })
      .safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(
      await repository.addOns.save({
        ...existing,
        name: parsed.data.name ?? existing.name,
        unitAmount: parsed.data.unitAmount ?? existing.unitAmount,
        quantity: parsed.data.quantity ?? existing.quantity,
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
      currency: client.currency,
      periodStart: null,
      periodEnd: null,
      status: "pending",
      invoiceId: null,
      createdAt: clock(),
    })
    return charge ? ok(charge) : fail("Charge could not be added")
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

  const invoiceCharges = async (
    clientId: string,
    chargeIds: readonly string[] | "all",
    actorId: string
  ): Promise<Result<Invoice[]>> => {
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
      Promise<Result<Invoice[]>>
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
        const invoice = await billing.issue(draft.value.id, actorId)
        if (!invoice.ok) return invoice
        await Promise.all(
          selected
            .filter((charge) => group.chargeIds.includes(charge.id))
            .map((charge) =>
              repository.charges.save({
                ...charge,
                status: "invoiced",
                invoiceId: invoice.value.id,
              })
            )
        )
        return ok([...acc.value, invoice.value])
      },
      Promise.resolve(ok([]))
    )
    return issued
  }

  const generateCharges = async (today: Date) => {
    const due = await repository.addOns.list({ dueBy: today })
    const created = await Promise.all(
      due.map(async (addOn) => {
        const result = dueCharges(addOn, today)
        const inserted = await Promise.all(
          result.charges.map((charge) =>
            repository.charges.insertIfNew({
              ...charge,
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
    return created.reduce((total, count) => total + count, 0)
  }

  const collectWithSavedCard = async (invoice: Invoice) => {
    const client = await billing.getClient(invoice.clientId)
    const card = client?.autopay.enabled ? client.autopay.card : null
    const owed = amountDue(invoice)
    if (!card || owed === 0) return "skipped" as const

    const result = await gateway.chargeSavedCard({
      customerId: card.stripeCustomerId,
      paymentMethodId: card.paymentMethodId,
      amount: owed,
      currency: invoice.currency,
      invoiceId: invoice.id,
      description: `Invoice ${invoice.number ?? invoice.id}`,
    })
    if (!result.ok) {
      await billing.notifyAutopayFailed(invoice.id)
      return "failed" as const
    }
    await billing.recordStripePayment({
      invoiceId: invoice.id,
      amount: owed,
      eventId: `autopay:${result.paymentId}`,
      paidAt: clock(),
    })
    return "collected" as const
  }

  const autoBill = async (settings: BillingSettings) => {
    if (!settings.autoBillEnabled)
      return { invoices: [] as Invoice[], errors: [] as string[] }
    const pending = await repository.charges.list({ status: "pending" })
    const clientIds = [...new Set(pending.map((charge) => charge.clientId))]
    const results = await Promise.all(
      clientIds.map(async (clientId) => {
        const client = await billing.getClient(clientId)
        if (!client?.autoBill || client.archivedAt) return ok<Invoice[]>([])
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
    const sent = await Promise.all(
      open
        .filter((invoice) => !skip.has(invoice.id))
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
    const autopay = await Promise.all(billed.invoices.map(collectWithSavedCard))
    const remindersSent = await sendScheduledReminders(
      settings,
      today,
      new Set(billed.invoices.map((invoice) => invoice.id))
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
      (invoice) => unique.includes(invoice.id) && invoice.status === "open"
    )
    if (selected.length !== unique.length)
      return fail("Some invoices can't be paid online")
    const currencies = new Set(selected.map((invoice) => invoice.currency))
    const [currency] = [...currencies]
    if (!currency || currencies.size > 1)
      return fail("Pay invoices in different currencies separately")
    const amount = selected.reduce(
      (total, invoice) => total + amountDue(invoice),
      0
    )
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
      (invoice): invoice is Invoice => invoice?.status === "open"
    )
    const allocation = allocatePayment(open, payment.amount)
    const results = await Promise.all(
      allocation.allocations.map((entry) =>
        billing.recordStripePayment({
          invoiceId: entry.invoiceId,
          amount: entry.amount,
          eventId: `${payment.eventId}:${entry.invoiceId}`,
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
    return addOns.reduce<Partial<Record<Currency, number>>>((totals, addOn) => {
      if (addOn.status !== "active" || addOn.interval === "one_time")
        return totals
      const monthly = Math.round(
        (addOn.unitAmount * addOn.quantity) /
          MONTHS_PER_INTERVAL[addOn.interval]
      )
      return {
        ...totals,
        [addOn.currency]: (totals[addOn.currency] ?? 0) + monthly,
      }
    }, {})
  }

  const upcomingRenewals = async (days: number) => {
    const until = new Date(clock().getTime() + days * DAY_MS)
    const addOns = await repository.addOns.list({ dueBy: until })
    return addOns
      .filter((addOn) => addOn.status === "active")
      .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime())
  }

  return {
    listCatalog: repository.catalog.list,
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
    monthlyRecurringRevenue,
    upcomingRenewals,
  }
}
