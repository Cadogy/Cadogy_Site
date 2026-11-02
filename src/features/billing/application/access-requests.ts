import { billingRecipients } from "../domain/contacts"
import { fail, ok, type Result } from "../domain/invoice"
import type { createBillingService } from "./billing-service"

const VALID_FOR_MS = 7 * 24 * 60 * 60 * 1000

export type AccessRequest = {
  readonly id: string
  readonly clientId: string
  readonly invoiceId: string
  readonly email: string
  readonly name: string
  readonly tokenHash: string
  readonly status: "pending" | "approved" | "declined"
  readonly createdAt: Date
  readonly expiresAt: Date
  readonly decidedAt: Date | null
}

export type AccessRequestRepository = {
  readonly insert: (
    request: Omit<AccessRequest, "id">
  ) => Promise<AccessRequest>
  readonly save: (request: AccessRequest) => Promise<AccessRequest>
  readonly findPending: (
    clientId: string,
    email: string,
    now: Date
  ) => Promise<AccessRequest | null>
  readonly findByTokenHash: (tokenHash: string) => Promise<AccessRequest | null>
}

type Dependencies = {
  readonly billing: ReturnType<typeof createBillingService>
  readonly repository: AccessRequestRepository
  readonly clock: () => Date
  readonly randomToken: () => string
  readonly hash: (token: string) => string
  readonly baseUrl: string
  readonly notify: {
    readonly requested: (
      to: readonly string[],
      details: {
        readonly requester: string
        readonly company: string
        readonly invoiceNumber: string
        readonly approveUrl: string
        readonly declineUrl: string
      }
    ) => Promise<void>
    readonly approved: (
      to: string,
      details: { readonly company: string }
    ) => Promise<void>
  }
}

type RequestOutcome = "already_contact" | "already_requested" | "requested"

const normalize = (email: string) => email.trim().toLowerCase()

const EXPIRED = "This link has expired or was already used."

export const createAccessRequests = ({
  billing,
  repository,
  clock,
  randomToken,
  hash,
  baseUrl,
  notify,
}: Dependencies) => {
  const request = async (input: {
    readonly invoiceToken: string
    readonly email: string
    readonly name: string
  }): Promise<Result<RequestOutcome>> => {
    const invoice = await billing.getByPublicToken(input.invoiceToken)
    const client = invoice ? await billing.getClient(invoice.clientId) : null
    if (!invoice || !client) return fail("Invoice not found.")

    const email = normalize(input.email)
    if (await billing.portalRoleFor(email, client.id))
      return ok("already_contact")
    const now = clock()
    if (await repository.findPending(client.id, email, now))
      return ok("already_requested")

    const token = randomToken()
    await repository.insert({
      clientId: client.id,
      invoiceId: invoice.id,
      email,
      name: input.name.trim(),
      tokenHash: hash(token),
      status: "pending",
      createdAt: now,
      expiresAt: new Date(now.getTime() + VALID_FOR_MS),
      decidedAt: null,
    })
    const url = `${baseUrl}/invoice/access/${token}`
    await notify.requested(billingRecipients(client), {
      requester: input.name.trim() ? `${input.name.trim()} (${email})` : email,
      company: client.company || client.name,
      invoiceNumber: invoice.number ?? "",
      approveUrl: url,
      declineUrl: `${url}?decision=decline`,
    })
    return ok("requested")
  }

  const decide = async (
    token: string,
    decision: "approve" | "decline"
  ): Promise<
    Result<{ decision: "approve" | "decline"; company: string; email: string }>
  > => {
    const now = clock()
    const pending = await repository.findByTokenHash(hash(token))
    if (!pending || pending.status !== "pending" || pending.expiresAt <= now)
      return fail(EXPIRED)
    const client = await billing.getClient(pending.clientId)
    if (!client) return fail(EXPIRED)

    await repository.save({
      ...pending,
      status: decision === "approve" ? "approved" : "declined",
      decidedAt: now,
    })
    const company = client.company || client.name
    if (decision === "approve") {
      const added = await billing.addContact(
        client.id,
        { email: pending.email, name: pending.name, role: "viewer" },
        { kind: "staff", id: "access-request" }
      )
      if (!added.ok && !(await billing.portalRoleFor(pending.email, client.id)))
        return fail(added.error)
      await notify.approved(pending.email, { company })
    }
    return ok({ decision, company, email: pending.email })
  }

  const preview = async (token: string) => {
    const pending = await repository.findByTokenHash(hash(token))
    if (
      !pending ||
      pending.status !== "pending" ||
      pending.expiresAt <= clock()
    )
      return null
    const [client, invoice] = await Promise.all([
      billing.getClient(pending.clientId),
      billing.getInvoice(pending.invoiceId),
    ])
    if (!client) return null
    return {
      email: pending.email,
      name: pending.name,
      company: client.company || client.name,
      invoiceNumber: invoice?.number ?? null,
    }
  }

  return { request, decide, preview }
}
