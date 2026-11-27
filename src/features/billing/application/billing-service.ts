import { isOneOf } from "@/lib/is-one-of"
import { fail, firstIssue, ok, type Result } from "@/lib/result"
import { isToken } from "@/lib/untrusted"

import {
  addContact as addContactTo,
  billingRecipients,
  changeContactRole,
  CONTACT_ROLES,
  contactRoleFor,
  NOT_A_CONTACT,
  removeContact as removeContactFrom,
  type ContactRole,
} from "../domain/contacts"
import { DAY_MS, startOfUtcDay } from "../domain/dates"
import { addByCurrency, type AmountsByCurrency } from "../domain/format"
import {
  type ClientSnapshot,
  type Invoice,
  type InvoiceEvent,
} from "../domain/invoice"
import {
  displayStatus,
  issueInvoice,
  markUncollectible,
  recordPayment,
  updateDraft,
  voidInvoice,
} from "../domain/lifecycle"
import { formatInvoiceNumber, invoiceCounterKey } from "../domain/numbering"
import {
  clientInputSchema,
  contactInputSchema,
  invoiceDraftInputSchema,
  paymentInputSchema,
  type InvoiceDraftInput,
} from "../domain/schema"
import { calculateInvoiceTotals, sum } from "../domain/totals"
import type {
  BillingClient,
  BillingNotification,
  BillingNotifier,
  BillingRepository,
  InvoiceFilter,
  SavedCard,
} from "./ports"

const VIEW_DEBOUNCE_MS = 60 * 60 * 1000

export type TeamActor =
  | { readonly kind: "staff"; readonly id: string }
  | { readonly kind: "contact"; readonly email: string }

type Dependencies = {
  readonly repository: BillingRepository
  readonly notifier: BillingNotifier
  readonly clock: () => Date
  readonly generateToken: () => string
}

export type BillingSummary = {
  readonly outstanding: AmountsByCurrency
  readonly overdue: AmountsByCurrency
  readonly paidLast30Days: AmountsByCurrency
  readonly openCount: number
  readonly overdueCount: number
}

const snapshotOf = (client: BillingClient): ClientSnapshot => ({
  name: client.name,
  company: client.company,
  email: client.email,
  address: client.address,
  taxId: client.taxId,
})

const recipientsOf = (client: BillingClient) => billingRecipients(client)

const withEvent = (invoice: Invoice, event: InvoiceEvent): Invoice => ({
  ...invoice,
  events: [...invoice.events, event],
})

export const createBillingService = ({
  repository,
  notifier,
  clock,
  generateToken,
}: Dependencies) => {
  const notify = async (notification: BillingNotification) => {
    try {
      await notifier.send(notification)
      return true
    } catch (error) {
      console.error(
        `Failed to send ${notification.kind} for ${notification.invoice.id}`,
        error
      )
      return false
    }
  }

  const loadInvoiceWithClient = async (id: string) => {
    const invoice = await repository.findInvoice(id)
    if (!invoice) return null
    const client = await repository.findClient(invoice.clientId)
    return client ? { invoice, client } : null
  }

  const saveResult = async (
    result: Result<Invoice>
  ): Promise<Result<Invoice>> =>
    result.ok ? ok(await repository.saveInvoice(result.value)) : result

  const notifyAndRecord = async (
    invoice: Invoice,
    client: BillingClient,
    kind: BillingNotification["kind"],
    eventType: InvoiceEvent["type"],
    actorId?: string,
    detail?: string
  ) => {
    const delivered = await notify({
      kind,
      invoice,
      recipients: recipientsOf(client),
    })
    if (!delivered) return invoice
    return repository.saveInvoice(
      withEvent(invoice, {
        type: eventType,
        at: clock(),
        actorId,
        ...(detail ? { detail } : {}),
      })
    )
  }

  const createClient = async (
    input: unknown
  ): Promise<Result<BillingClient>> => {
    const parsed = clientInputSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(
      await repository.insertClient({
        ...parsed.data,
        archivedAt: null,
        autoBill: true,
        autopay: { enabled: false, card: null },
        contacts: [],
      })
    )
  }

  const updateClient = async (
    id: string,
    input: unknown
  ): Promise<Result<BillingClient>> => {
    const existing = await repository.findClient(id)
    if (!existing) return fail("Client not found")
    const parsed = clientInputSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return ok(await repository.saveClient({ ...existing, ...parsed.data }))
  }

  const setClientArchived = async (id: string, archived: boolean) => {
    const existing = await repository.findClient(id)
    if (!existing) return fail<BillingClient>("Client not found")
    return ok(
      await repository.saveClient({
        ...existing,
        archivedAt: archived ? clock() : null,
      })
    )
  }

  const updateClientBilling = async (
    id: string,
    change: (client: BillingClient) => Result<BillingClient>
  ): Promise<Result<BillingClient>> => {
    const existing = await repository.findClient(id)
    if (!existing) return fail("Client not found")
    const next = change(existing)
    return next.ok ? ok(await repository.saveClient(next.value)) : next
  }

  const saveCard = (id: string, card: SavedCard) =>
    updateClientBilling(id, (client) =>
      ok({ ...client, autopay: { enabled: true, card } })
    )

  const removeCard = (id: string) =>
    updateClientBilling(id, (client) =>
      ok({ ...client, autopay: { enabled: false, card: null } })
    )

  const setAutoBill = (id: string, autoBill: boolean) =>
    updateClientBilling(id, (client) => ok({ ...client, autoBill }))

  const setAutopay = (id: string, enabled: boolean) =>
    updateClientBilling(id, (client) =>
      enabled && !client.autopay.card
        ? fail("Save a card before turning on autopay")
        : ok({ ...client, autopay: { ...client.autopay, enabled } })
    )

  const clientsForPortalUser = (email: string) =>
    repository.findClientsByEmail(email.trim().toLowerCase())

  const portalRoleFor = async (
    email: string,
    clientId: string
  ): Promise<ContactRole | null> => {
    const client = await repository.findClient(clientId)
    return client ? contactRoleFor(client, email) : null
  }

  const requireBillingContact = async (email: string, clientId: string) => {
    const role = await portalRoleFor(email, clientId)
    if (!role) return fail<null>("Client not found")
    if (role !== "billing")
      return fail<null>("Only billing contacts can manage autopay and cards.")
    return ok(null)
  }

  const setPortalAutopay = async (
    email: string,
    clientId: string,
    enabled: boolean
  ): Promise<Result<BillingClient>> => {
    const allowed = await requireBillingContact(email, clientId)
    return allowed.ok ? setAutopay(clientId, enabled) : allowed
  }

  const canManageTeam = async (actor: TeamActor, clientId: string) =>
    actor.kind === "staff" ||
    (await portalRoleFor(actor.email, clientId)) === "billing"

  const changeTeam = async (
    clientId: string,
    actor: TeamActor,
    change: (client: BillingClient) => Result<BillingClient["contacts"]>
  ): Promise<Result<BillingClient>> => {
    if (!(await canManageTeam(actor, clientId)))
      return fail("Only billing contacts can manage the team.")
    return updateClientBilling(clientId, (client) => {
      const contacts = change(client)
      return contacts.ok
        ? ok({ ...client, contacts: contacts.value })
        : contacts
    })
  }

  const addContact = (clientId: string, input: unknown, actor: TeamActor) => {
    const parsed = contactInputSchema.safeParse(input)
    if (!parsed.success)
      return Promise.resolve(fail<BillingClient>(firstIssue(parsed.error)))
    return changeTeam(clientId, actor, (client) =>
      addContactTo(client, parsed.data, {
        at: clock(),
        by: actor.kind === "staff" ? actor.id : actor.email,
      })
    )
  }

  const isContactRole = isOneOf(CONTACT_ROLES)

  const setContactRole = (
    clientId: string,
    email: unknown,
    role: unknown,
    actor: TeamActor
  ) => {
    if (!isToken(email, 320))
      return Promise.resolve(fail<BillingClient>(NOT_A_CONTACT))
    if (!isContactRole(role))
      return Promise.resolve(
        fail<BillingClient>("Choose billing or viewer access.")
      )
    return changeTeam(clientId, actor, (client) =>
      changeContactRole(client, email, role)
    )
  }

  const removeContact = (clientId: string, email: unknown, actor: TeamActor) =>
    isToken(email, 320)
      ? changeTeam(clientId, actor, (client) =>
          removeContactFrom(client, email)
        )
      : Promise.resolve(fail<BillingClient>(NOT_A_CONTACT))

  const createDraft = async (
    input: Partial<Omit<InvoiceDraftInput, "dueDate">> & { clientId: string },
    actorId: string
  ): Promise<Result<Invoice>> => {
    const client = await repository.findClient(input.clientId)
    if (!client) return fail("Client not found")

    const parsed = invoiceDraftInputSchema.safeParse({
      currency: client.currency,
      termsDays: client.defaultTermsDays,
      lineItems: [],
      ...input,
    })
    if (!parsed.success) return fail(firstIssue(parsed.error))

    return ok(
      await repository.insertInvoice({
        ...parsed.data,
        number: null,
        clientSnapshot: null,
        status: "draft",
        issueDate: null,
        dueDate: null,
        payments: [],
        adjustments: [],
        events: [{ type: "created", at: clock(), actorId }],
        publicToken: generateToken(),
      })
    )
  }

  const updateDraftInvoice = async (
    id: string,
    input: unknown,
    actorId: string
  ): Promise<Result<Invoice>> => {
    const invoice = await repository.findInvoice(id)
    if (!invoice) return fail("Invoice not found")
    const parsed = invoiceDraftInputSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    if (!(await repository.findClient(parsed.data.clientId)))
      return fail("Client not found")

    const updated = updateDraft(invoice, parsed.data)
    if (!updated.ok) return updated
    return ok(
      await repository.saveInvoice(
        withEvent(updated.value, { type: "updated", at: clock(), actorId })
      )
    )
  }

  const deleteDraft = async (id: string): Promise<Result<null>> => {
    const invoice = await repository.findInvoice(id)
    if (!invoice) return fail("Invoice not found")
    if (invoice.status !== "draft") return fail("Only drafts can be deleted")
    await repository.deleteInvoice(id)
    return ok(null)
  }

  /**
   * `beforeNotify` runs after the invoice is numbered and saved but before the
   * client is emailed, so a credit balance applied there is reflected in the
   * amount the email asks for.
   */
  const issue = async (
    id: string,
    actorId: string,
    options: { beforeNotify?: (invoice: Invoice) => Promise<Invoice> } = {}
  ): Promise<Result<Invoice>> => {
    const loaded = await loadInvoiceWithClient(id)
    if (!loaded) return fail("Invoice not found")
    const { invoice, client } = loaded
    const issueDate = startOfUtcDay(clock())
    const args = { client: snapshotOf(client), issueDate, actorId }

    const precheck = issueInvoice(invoice, { ...args, number: "pending" })
    if (!precheck.ok) return precheck

    const year = issueDate.getUTCFullYear()
    const sequence = await repository.nextSequence(invoiceCounterKey(year))
    const issued = await saveResult(
      issueInvoice(invoice, {
        ...args,
        number: formatInvoiceNumber({ year, sequence }),
      })
    )
    if (!issued.ok) return issued
    const prepared = options.beforeNotify
      ? await options.beforeNotify(issued.value)
      : issued.value
    return ok(
      await notifyAndRecord(prepared, client, "issued", "sent", actorId)
    )
  }

  const applyPayment = async (
    id: string,
    payment: Parameters<typeof recordPayment>[1],
    actorId: string,
    { sendReceipt = true }: { sendReceipt?: boolean } = {}
  ): Promise<Result<Invoice>> => {
    const loaded = await loadInvoiceWithClient(id)
    if (!loaded) return fail("Invoice not found")
    const { invoice, client } = loaded

    const result = recordPayment(invoice, payment, { actorId, at: clock() })
    if (!result.ok) return result
    if (result.value === invoice) return ok(invoice)

    const saved = await repository.saveInvoice(result.value)
    if (!sendReceipt) return ok(saved)
    await notify({
      kind: "receipt",
      invoice: saved,
      recipients: recipientsOf(client),
    })
    return ok(saved)
  }

  const recordManualPayment = async (
    id: string,
    input: unknown,
    actorId: string
  ): Promise<Result<Invoice>> => {
    const parsed = paymentInputSchema.safeParse(input)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    return applyPayment(id, parsed.data, actorId)
  }

  const recordStripePayment = (event: {
    invoiceId: string
    amount: number
    eventId: string
    paidAt: Date
    paymentIntentId?: string
  }) =>
    applyPayment(
      event.invoiceId,
      {
        amount: event.amount,
        method: "stripe",
        reference: event.paymentIntentId ?? event.eventId,
        paidAt: event.paidAt,
        stripeEventId: event.eventId,
        ...(event.paymentIntentId
          ? { stripePaymentIntentId: event.paymentIntentId }
          : {}),
      },
      "stripe"
    )

  const recordCreditPayment = (
    id: string,
    amount: number,
    reference: string,
    actorId: string
  ) =>
    // Using up credit isn't money received, so it never sends a receipt; the
    // invoice and its emails show the credit applied instead.
    applyPayment(
      id,
      { amount, method: "credit", reference, paidAt: clock() },
      actorId,
      { sendReceipt: false }
    )

  const transition =
    (apply: typeof voidInvoice) =>
    async (id: string, actorId: string): Promise<Result<Invoice>> => {
      const invoice = await repository.findInvoice(id)
      if (!invoice) return fail("Invoice not found")
      return saveResult(apply(invoice, { actorId, at: clock() }))
    }

  /**
   * Copies what was billed (lines, discount, footer) but takes terms from the
   * client and tax and payment instructions from today's defaults, as a new
   * draft would. The currency stays, because the copied prices are in it.
   */
  const duplicate = async (
    id: string,
    actorId: string,
    defaults: { readonly taxRateBps: number; readonly memo: string } = {
      taxRateBps: 0,
      memo: "",
    }
  ): Promise<Result<Invoice>> => {
    const invoice = await repository.findInvoice(id)
    if (!invoice) return fail("Invoice not found")
    const client = await repository.findClient(invoice.clientId)
    return createDraft(
      {
        clientId: invoice.clientId,
        currency: invoice.currency,
        termsDays: client?.defaultTermsDays ?? invoice.termsDays,
        lineItems: [...invoice.lineItems],
        discount: invoice.discount,
        taxRateBps: defaults.taxRateBps,
        memo: defaults.memo,
        footer: invoice.footer,
        internalNotes: "",
      },
      actorId
    )
  }

  const sendReminder = async (
    id: string,
    actorId: string,
    detail?: string
  ): Promise<Result<Invoice>> => {
    const loaded = await loadInvoiceWithClient(id)
    if (!loaded) return fail("Invoice not found")
    if (loaded.invoice.status !== "open")
      return fail("Only open invoices can be reminded")
    return ok(
      await notifyAndRecord(
        loaded.invoice,
        loaded.client,
        "reminder",
        "reminder_sent",
        actorId,
        detail
      )
    )
  }

  const resendInvoice = async (
    id: string,
    actorId: string
  ): Promise<Result<Invoice>> => {
    const loaded = await loadInvoiceWithClient(id)
    if (!loaded) return fail("Invoice not found")
    if (loaded.invoice.status !== "open")
      return fail("Only open invoices can be sent.")
    return ok(
      await notifyAndRecord(
        loaded.invoice,
        loaded.client,
        "issued",
        "sent",
        actorId
      )
    )
  }

  /** Records the failed attempt (retries count these) and tells the client. */
  const notifyAutopayFailed = async (id: string, error?: string) => {
    const loaded = await loadInvoiceWithClient(id)
    if (!loaded) return false
    const invoice = await repository.saveInvoice(
      withEvent(loaded.invoice, {
        type: "autopay_failed",
        at: clock(),
        actorId: "system",
        ...(error ? { detail: error } : {}),
      })
    )
    return notify({
      kind: "autopay_failed",
      invoice,
      recipients: recipientsOf(loaded.client),
    })
  }

  const getByPublicToken = async (token: unknown) => {
    if (!isToken(token)) return null
    const invoice = await repository.findInvoiceByToken(token)
    return invoice && invoice.status !== "draft" ? invoice : null
  }

  const markViewed = async (invoice: Invoice) => {
    const now = clock()
    const recentlyViewed = invoice.events.some(
      (event) =>
        event.type === "viewed" &&
        now.getTime() - event.at.getTime() < VIEW_DEBOUNCE_MS
    )
    if (recentlyViewed) return invoice
    return repository.saveInvoice(
      withEvent(invoice, { type: "viewed", at: now })
    )
  }

  const summary = async (): Promise<BillingSummary> => {
    const now = clock()
    const since = now.getTime() - 30 * DAY_MS
    const invoices = await repository.listInvoices({})

    return invoices.reduce<BillingSummary>(
      (acc, invoice) => {
        const { amountDue } = calculateInvoiceTotals(invoice)
        const isOpen = invoice.status === "open"
        const isOverdue = displayStatus(invoice, now) === "overdue"
        const recentPayments = sum(
          invoice.payments
            .filter((payment) => payment.paidAt.getTime() >= since)
            .map((payment) => payment.amount)
        )

        return {
          outstanding: isOpen
            ? addByCurrency(acc.outstanding, invoice.currency, amountDue)
            : acc.outstanding,
          overdue: isOverdue
            ? addByCurrency(acc.overdue, invoice.currency, amountDue)
            : acc.overdue,
          paidLast30Days:
            recentPayments > 0
              ? addByCurrency(
                  acc.paidLast30Days,
                  invoice.currency,
                  recentPayments
                )
              : acc.paidLast30Days,
          openCount: acc.openCount + (isOpen ? 1 : 0),
          overdueCount: acc.overdueCount + (isOverdue ? 1 : 0),
        }
      },
      {
        outstanding: {},
        overdue: {},
        paidLast30Days: {},
        openCount: 0,
        overdueCount: 0,
      }
    )
  }

  const newestFirst = (a: Invoice, b: Invoice) =>
    (b.issueDate?.getTime() ?? Infinity) - (a.issueDate?.getTime() ?? Infinity)

  const listInvoices = async (filter: InvoiceFilter) =>
    [...(await repository.listInvoices(filter))].sort(newestFirst)

  const listForPortalUser = async (email: string) => {
    const clients = await repository.findClientsByEmail(
      email.trim().toLowerCase()
    )
    if (clients.length === 0) return []
    const invoices = await listInvoices({
      clientIds: clients.map((client) => client.id),
    })
    return invoices.filter((invoice) => invoice.status !== "draft")
  }

  return {
    createClient,
    updateClient,
    archiveClient: (id: string) => setClientArchived(id, true),
    restoreClient: (id: string) => setClientArchived(id, false),
    saveCard,
    removeCard,
    setAutoBill,
    setAutopay,
    setPortalAutopay,
    requireBillingContact,
    portalRoleFor,
    clientsForPortalUser,
    addContact,
    setContactRole,
    removeContact,
    getClient: repository.findClient,
    listClients: repository.listClients,
    createDraft,
    updateDraftInvoice,
    deleteDraft,
    issue,
    recordPayment: recordManualPayment,
    recordStripePayment,
    recordCreditPayment,
    voidInvoice: transition(voidInvoice),
    markUncollectible: transition(markUncollectible),
    duplicate,
    sendReminder,
    resendInvoice,
    notifyAutopayFailed,
    getInvoice: repository.findInvoice,
    getByPublicToken,
    markViewed,
    listInvoices,
    listForPortalUser,
    summary,
  }
}
