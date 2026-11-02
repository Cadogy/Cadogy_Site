import { describe, expect, it } from "vitest"

import { buildLineItem } from "../domain/test-factories"
import {
  createAccessRequests,
  type AccessRequest,
  type AccessRequestRepository,
} from "./access-requests"
import { createBillingService } from "./billing-service"
import {
  createInMemoryBillingRepository,
  createRecordingNotifier,
} from "./test-doubles"

const ADMIN = "admin-1"

const createInMemoryRequests = (): AccessRequestRepository => {
  const requests = new Map<string, AccessRequest>()
  let next = 0
  return {
    insert: async (request) => {
      const stored = { ...request, id: `req_${++next}` }
      requests.set(stored.id, stored)
      return stored
    },
    save: async (request) => {
      requests.set(request.id, request)
      return request
    },
    findPending: async (clientId, email, now) =>
      [...requests.values()].find(
        (request) =>
          request.clientId === clientId &&
          request.email === email &&
          request.status === "pending" &&
          request.expiresAt > now
      ) ?? null,
    findByTokenHash: async (tokenHash) =>
      [...requests.values()].find(
        (request) => request.tokenHash === tokenHash
      ) ?? null,
  }
}

const setup = () => {
  let now = new Date("2026-11-02T12:00:00.000Z")
  const sent: { kind: string; to: readonly string[]; detail: string }[] = []
  let tokens = 0
  const billing = createBillingService({
    repository: createInMemoryBillingRepository(),
    notifier: createRecordingNotifier(),
    clock: () => now,
    generateToken: () => `invoice-token-${++tokens}`,
  })
  const access = createAccessRequests({
    billing,
    repository: createInMemoryRequests(),
    clock: () => now,
    randomToken: () => `approval-${++tokens}`,
    hash: (token) => `hash(${token})`,
    notify: {
      requested: async (to, { requester, approveUrl }) => {
        sent.push({
          kind: "requested",
          to,
          detail: `${requester} ${approveUrl}`,
        })
      },
      approved: async (to, { company }) => {
        sent.push({ kind: "approved", to: [to], detail: company })
      },
    },
    baseUrl: "https://www.cadogy.com",
  })
  const advance = (days: number) => {
    now = new Date(now.getTime() + days * 86_400_000)
  }
  return { billing, access, sent, advance }
}

const issuedInvoice = async (billing: ReturnType<typeof setup>["billing"]) => {
  const client = await billing.createClient({
    name: "Ada",
    email: "finance@acme.example",
    company: "Acme",
  })
  if (!client.ok) throw new Error(client.error)
  const draft = await billing.createDraft(
    { clientId: client.value.id, lineItems: [buildLineItem()] },
    ADMIN
  )
  if (!draft.ok) throw new Error(draft.error)
  const issued = await billing.issue(draft.value.id, ADMIN)
  if (!issued.ok) throw new Error(issued.error)
  return { client: client.value, invoice: issued.value }
}

describe("access requests", () => {
  it("recognizes people who are already on the account", async () => {
    const { billing, access, sent } = setup()
    const { invoice } = await issuedInvoice(billing)

    expect(
      await access.request({
        invoiceToken: invoice.publicToken,
        email: "Finance@Acme.example",
        name: "Finance",
      })
    ).toEqual({ ok: true, value: "already_contact" })
    expect(sent).toEqual([])
  })

  it("asks the billing contacts to approve someone new", async () => {
    const { billing, access, sent } = setup()
    const { invoice } = await issuedInvoice(billing)

    const result = await access.request({
      invoiceToken: invoice.publicToken,
      email: "lead@acme.example",
      name: "Project Lead",
    })

    expect(result).toEqual({ ok: true, value: "requested" })
    expect(sent).toEqual([
      {
        kind: "requested",
        to: ["finance@acme.example"],
        detail:
          "Project Lead (lead@acme.example) https://www.cadogy.com/invoice/access/approval-2",
      },
    ])
  })

  it("doesn't email again for a request that's still pending", async () => {
    const { billing, access, sent } = setup()
    const { invoice } = await issuedInvoice(billing)
    const input = {
      invoiceToken: invoice.publicToken,
      email: "lead@acme.example",
      name: "Lead",
    }

    await access.request(input)
    expect(await access.request(input)).toEqual({
      ok: true,
      value: "already_requested",
    })
    expect(sent).toHaveLength(1)
  })

  it("adds the requester as a viewer when approved, once", async () => {
    const { billing, access, sent } = setup()
    const { client, invoice } = await issuedInvoice(billing)
    await access.request({
      invoiceToken: invoice.publicToken,
      email: "lead@acme.example",
      name: "Lead",
    })

    expect(await access.decide("approval-2", "approve")).toEqual({
      ok: true,
      value: {
        decision: "approve",
        company: "Acme",
        email: "lead@acme.example",
      },
    })
    expect(await billing.portalRoleFor("lead@acme.example", client.id)).toBe(
      "viewer"
    )
    expect(sent.at(-1)).toEqual({
      kind: "approved",
      to: ["lead@acme.example"],
      detail: "Acme",
    })
    expect(await access.decide("approval-2", "approve")).toMatchObject({
      ok: false,
    })
  })

  it("declines without adding anyone", async () => {
    const { billing, access } = setup()
    const { client, invoice } = await issuedInvoice(billing)
    await access.request({
      invoiceToken: invoice.publicToken,
      email: "lead@acme.example",
      name: "Lead",
    })

    await access.decide("approval-2", "decline")

    expect(
      await billing.portalRoleFor("lead@acme.example", client.id)
    ).toBeNull()
  })

  it("rejects expired links", async () => {
    const { billing, access, advance } = setup()
    const { invoice } = await issuedInvoice(billing)
    await access.request({
      invoiceToken: invoice.publicToken,
      email: "lead@acme.example",
      name: "Lead",
    })

    advance(8)

    expect(await access.decide("approval-2", "approve")).toEqual({
      ok: false,
      error: "This link has expired or was already used.",
    })
  })

  it("ignores unknown or draft invoices", async () => {
    const { access } = setup()

    expect(
      await access.request({
        invoiceToken: "nope",
        email: "lead@acme.example",
        name: "Lead",
      })
    ).toEqual({ ok: false, error: "Invoice not found." })
  })

  it("previews a pending request without changing it", async () => {
    const { billing, access } = setup()
    const { invoice } = await issuedInvoice(billing)
    await access.request({
      invoiceToken: invoice.publicToken,
      email: "lead@acme.example",
      name: "Lead",
    })

    expect(await access.preview("approval-2")).toEqual({
      email: "lead@acme.example",
      name: "Lead",
      company: "Acme",
      invoiceNumber: invoice.number,
    })
    expect(await access.preview("approval-2")).not.toBeNull()
    expect(await access.preview("nope")).toBeNull()
  })
})
