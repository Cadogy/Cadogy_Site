import { describe, expect, it } from "vitest"

import { buildLineItem } from "../domain/test-factories"
import { createBillingService } from "./billing-service"
import {
  createInMemoryBillingRepository,
  createRecordingNotifier,
} from "./test-doubles"

const ADMIN = "admin-1"
const NOW = new Date("2026-11-01T15:30:00.000Z")

const setup = () => {
  const repository = createInMemoryBillingRepository()
  const notifier = createRecordingNotifier()
  let tokenCounter = 0
  const service = createBillingService({
    repository,
    notifier,
    clock: () => NOW,
    generateToken: () => `token-${++tokenCounter}`,
  })
  return { repository, notifier, service }
}

const clientInput = {
  name: "Ada Lovelace",
  email: "billing@analytical.example",
  company: "Analytical Engines Inc.",
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(`Expected ok, got: ${result.error}`)
  return result.value
}

const savedCard = {
  stripeCustomerId: "cus_1",
  paymentMethodId: "pm_1",
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2030,
}

const draftFor = async (
  service: ReturnType<typeof setup>["service"],
  overrides: Record<string, unknown> = {}
) => {
  const client = expectOk(await service.createClient(clientInput))
  const draft = expectOk(
    await service.createDraft(
      {
        clientId: client.id,
        lineItems: [buildLineItem({ quantity: 10, unitAmount: 15_000 })],
        ...overrides,
      },
      ADMIN
    )
  )
  return { client, draft }
}

describe("billing service", () => {
  it("creates drafts with the client's currency and terms and no number", async () => {
    const { service } = setup()
    const client = expectOk(
      await service.createClient({
        ...clientInput,
        currency: "EUR",
        defaultTermsDays: 30,
      })
    )
    const draft = expectOk(
      await service.createDraft({ clientId: client.id }, ADMIN)
    )

    expect(draft.number).toBeNull()
    expect(draft.status).toBe("draft")
    expect(draft.currency).toBe("EUR")
    expect(draft.termsDays).toBe(30)
    expect(draft.publicToken).toBe("token-1")
    expect(draft.events.map((event) => event.type)).toEqual(["created"])
  })

  it("refuses to create a draft for an unknown client", async () => {
    const { service } = setup()
    const result = await service.createDraft({ clientId: "missing" }, ADMIN)
    expect(result).toEqual({ ok: false, error: "Client not found" })
  })

  it("issues invoices with gapless yearly numbers and emails the client", async () => {
    const { service, notifier } = setup()
    const { draft: first } = await draftFor(service)
    const { draft: second } = await draftFor(service)

    const issuedFirst = expectOk(await service.issue(first.id, ADMIN))
    const issuedSecond = expectOk(await service.issue(second.id, ADMIN))

    expect(issuedFirst.number).toBe("CAD-2026-0001")
    expect(issuedSecond.number).toBe("CAD-2026-0002")
    expect(issuedFirst.issueDate).toEqual(new Date("2026-11-01T00:00:00.000Z"))
    expect(
      notifier.sent.map((message) => [message.kind, message.invoice.number])
    ).toEqual([
      ["issued", "CAD-2026-0001"],
      ["issued", "CAD-2026-0002"],
    ])
    expect(issuedFirst.events.map((event) => event.type)).toEqual([
      "created",
      "issued",
      "sent",
    ])
  })

  it("does not burn an invoice number when issuing fails", async () => {
    const { service } = setup()
    const { draft: empty } = await draftFor(service, { lineItems: [] })
    const { draft: valid } = await draftFor(service)

    expect((await service.issue(empty.id, ADMIN)).ok).toBe(false)
    expect(expectOk(await service.issue(valid.id, ADMIN)).number).toBe(
      "CAD-2026-0001"
    )
  })

  it("deletes drafts but never issued invoices", async () => {
    const { service } = setup()
    const { draft } = await draftFor(service)
    const { draft: other } = await draftFor(service)
    expectOk(await service.issue(other.id, ADMIN))

    expect((await service.deleteDraft(draft.id)).ok).toBe(true)
    expect(await service.getInvoice(draft.id)).toBeNull()
    expect(await service.deleteDraft(other.id)).toEqual({
      ok: false,
      error: "Only drafts can be deleted",
    })
  })

  it("records a full payment, marks the invoice paid and sends a receipt", async () => {
    const { service, notifier } = setup()
    const { draft } = await draftFor(service)
    expectOk(await service.issue(draft.id, ADMIN))

    const paid = expectOk(
      await service.recordPayment(
        draft.id,
        {
          amount: 150_000,
          method: "bank_transfer",
          reference: "WIRE-1",
          paidAt: NOW,
        },
        ADMIN
      )
    )

    expect(paid.status).toBe("paid")
    expect(notifier.sent.at(-1)?.kind).toBe("receipt")
  })

  it("records Stripe payments idempotently by event id", async () => {
    const { service, notifier } = setup()
    const { draft } = await draftFor(service)
    expectOk(await service.issue(draft.id, ADMIN))
    const event = {
      invoiceId: draft.id,
      amount: 150_000,
      eventId: "evt_1",
      paidAt: NOW,
    }

    expectOk(await service.recordStripePayment(event))
    const replay = expectOk(await service.recordStripePayment(event))

    expect(replay.payments).toHaveLength(1)
    expect(
      notifier.sent.filter((message) => message.kind === "receipt")
    ).toHaveLength(1)
  })

  it("duplicates any invoice into a fresh draft", async () => {
    const { service } = setup()
    const { draft } = await draftFor(service, { memo: "Retainer" })
    expectOk(await service.issue(draft.id, ADMIN))

    const copy = expectOk(await service.duplicate(draft.id, ADMIN))

    expect(copy.id).not.toBe(draft.id)
    expect(copy.status).toBe("draft")
    expect(copy.number).toBeNull()
    expect(copy.memo).toBe("Retainer")
    expect(copy.payments).toEqual([])
  })

  it("sends reminders only for open invoices", async () => {
    const { service, notifier } = setup()
    const { draft } = await draftFor(service)

    expect((await service.sendReminder(draft.id, ADMIN)).ok).toBe(false)
    expectOk(await service.issue(draft.id, ADMIN))
    const reminded = expectOk(await service.sendReminder(draft.id, ADMIN))

    expect(notifier.sent.at(-1)?.kind).toBe("reminder")
    expect(reminded.events.at(-1)?.type).toBe("reminder_sent")
  })

  it("serves issued invoices by public token and hides drafts", async () => {
    const { service } = setup()
    const { draft } = await draftFor(service)

    expect(await service.getByPublicToken(draft.publicToken)).toBeNull()
    expectOk(await service.issue(draft.id, ADMIN))
    expect((await service.getByPublicToken(draft.publicToken))?.id).toBe(
      draft.id
    )
    expect(await service.getByPublicToken("unknown")).toBeNull()
  })

  it("summarises outstanding, overdue and recently paid amounts", async () => {
    const { service, repository } = setup()
    const { draft: open } = await draftFor(service)
    const { draft: paid } = await draftFor(service)
    expectOk(await service.issue(open.id, ADMIN))
    expectOk(await service.issue(paid.id, ADMIN))
    expectOk(
      await service.recordPayment(
        paid.id,
        { amount: 150_000, method: "check", reference: "", paidAt: NOW },
        ADMIN
      )
    )
    const stored = await repository.findInvoice(open.id)
    await repository.saveInvoice({
      ...stored!,
      dueDate: new Date("2026-10-01T00:00:00.000Z"),
    })

    const summary = await service.summary()

    expect(summary).toEqual({
      outstanding: { USD: 150_000 },
      overdue: { USD: 150_000 },
      paidLast30Days: { USD: 150_000 },
      openCount: 1,
      overdueCount: 1,
    })
  })

  it("lists only issued invoices for a portal user's billing email", async () => {
    const { service } = setup()
    const { draft: issued } = await draftFor(service)
    await draftFor(service)
    expectOk(await service.issue(issued.id, ADMIN))

    const visible = await service.listForPortalUser(
      "BILLING@analytical.example"
    )

    expect(visible.map((invoice) => invoice.id)).toEqual([issued.id])
  })
  it("edits drafts through the full input schema and logs the change", async () => {
    const { service } = setup()
    const { client, draft } = await draftFor(service)

    const updated = expectOk(
      await service.updateDraftInvoice(
        draft.id,
        {
          clientId: client.id,
          currency: "USD",
          termsDays: 7,
          lineItems: [
            buildLineItem({ description: "Audit", unitAmount: 90_000 }),
          ],
          taxRateBps: 600,
        },
        ADMIN
      )
    )

    expect(updated.termsDays).toBe(7)
    expect(updated.lineItems[0]?.description).toBe("Audit")
    expect(updated.events.at(-1)?.type).toBe("updated")
    expect(
      await service.updateDraftInvoice(draft.id, { clientId: client.id }, ADMIN)
    ).toMatchObject({ ok: false })
  })

  it("archives and restores clients without losing them", async () => {
    const { service } = setup()
    const client = expectOk(await service.createClient(clientInput))

    expectOk(await service.archiveClient(client.id))
    expect(await service.listClients({ includeArchived: false })).toEqual([])
    expect(await service.listClients({ includeArchived: true })).toHaveLength(1)

    expectOk(await service.restoreClient(client.id))
    expect(await service.listClients({ includeArchived: false })).toHaveLength(
      1
    )
  })

  it("rejects invalid client details", async () => {
    const { service } = setup()
    expect(
      await service.createClient({ name: "", email: "nope" })
    ).toMatchObject({
      ok: false,
    })
  })

  it("logs a client view at most once an hour", async () => {
    const { service } = setup()
    const { draft } = await draftFor(service)
    const issued = expectOk(await service.issue(draft.id, ADMIN))

    const viewed = await service.markViewed(issued)
    const again = await service.markViewed(viewed)

    expect(
      viewed.events.filter((event) => event.type === "viewed")
    ).toHaveLength(1)
    expect(again).toBe(viewed)
  })

  it("saves a card from checkout and turns on autopay", async () => {
    const { service } = setup()
    const client = expectOk(await service.createClient(clientInput))

    const updated = expectOk(await service.saveCard(client.id, savedCard))

    expect(updated.autopay).toEqual({ enabled: true, card: savedCard })
  })

  it("lets a portal user switch autopay only on their own account with a saved card", async () => {
    const { service } = setup()
    const client = expectOk(await service.createClient(clientInput))
    const other = expectOk(
      await service.createClient({ name: "Eve", email: "eve@example.com" })
    )

    expect(
      await service.setPortalAutopay(clientInput.email, client.id, true)
    ).toMatchObject({ ok: false })
    expectOk(await service.saveCard(client.id, savedCard))
    expect(
      await service.setPortalAutopay("eve@example.com", client.id, false)
    ).toMatchObject({ ok: false })

    const off = expectOk(
      await service.setPortalAutopay(clientInput.email, client.id, false)
    )
    expect(off.autopay).toEqual({ enabled: false, card: savedCard })
    expect((await service.getClient(other.id))?.autopay.enabled).toBe(false)
  })

  it("removes a saved card and stops autopay", async () => {
    const { service } = setup()
    const client = expectOk(await service.createClient(clientInput))
    expectOk(await service.saveCard(client.id, savedCard))

    const updated = expectOk(await service.removeCard(client.id))

    expect(updated.autopay).toEqual({ enabled: false, card: null })
  })

  it("switches a client between automatic and manual billing", async () => {
    const { service } = setup()
    const client = expectOk(await service.createClient(clientInput))

    const manual = expectOk(await service.setAutoBill(client.id, false))

    expect(manual.autoBill).toBe(false)
  })

  it("finds the billing accounts a portal user can manage", async () => {
    const { service } = setup()
    const client = expectOk(await service.createClient(clientInput))
    expectOk(
      await service.createClient({ name: "Eve", email: "eve@example.com" })
    )

    const accounts = await service.clientsForPortalUser(
      " Billing@Analytical.example "
    )

    expect(accounts.map((account) => account.id)).toEqual([client.id])
  })

  describe("client teams", () => {
    const staff = { kind: "staff" as const, id: ADMIN }

    it("lets staff add contacts, and lets viewers see invoices", async () => {
      const { service } = setup()
      const { client, draft } = await draftFor(service)
      expectOk(await service.issue(draft.id, ADMIN))

      expectOk(
        await service.addContact(
          client.id,
          { email: "Lead@Analytical.example", name: "Lead", role: "viewer" },
          staff
        )
      )

      const visible = await service.listForPortalUser("lead@analytical.example")
      expect(visible.map((invoice) => invoice.id)).toEqual([draft.id])
      expect(
        await service.portalRoleFor("lead@analytical.example", client.id)
      ).toBe("viewer")
    })

    it("sends invoices to billing contacts but not viewers", async () => {
      const { service, notifier } = setup()
      const { client, draft } = await draftFor(service)
      expectOk(
        await service.addContact(
          client.id,
          { email: "ap@analytical.example", name: "AP", role: "billing" },
          staff
        )
      )
      expectOk(
        await service.addContact(
          client.id,
          { email: "lead@analytical.example", name: "Lead", role: "viewer" },
          staff
        )
      )

      expectOk(await service.issue(draft.id, ADMIN))

      expect(notifier.sent.at(-1)?.recipients).toEqual([
        "billing@analytical.example",
        "ap@analytical.example",
      ])
    })

    it("lets billing contacts manage the team, but not viewers", async () => {
      const { service } = setup()
      const client = expectOk(await service.createClient(clientInput))
      expectOk(
        await service.addContact(
          client.id,
          { email: "lead@analytical.example", name: "Lead", role: "viewer" },
          { kind: "contact", email: clientInput.email }
        )
      )

      expect(
        await service.addContact(
          client.id,
          { email: "eve@example.com", name: "Eve", role: "billing" },
          { kind: "contact", email: "lead@analytical.example" }
        )
      ).toEqual({
        ok: false,
        error: "Only billing contacts can manage the team.",
      })
    })

    it("keeps autopay and saved cards with billing contacts", async () => {
      const { service } = setup()
      const client = expectOk(await service.createClient(clientInput))
      expectOk(await service.saveCard(client.id, savedCard))
      expectOk(
        await service.addContact(
          client.id,
          { email: "lead@analytical.example", name: "Lead", role: "viewer" },
          staff
        )
      )

      expect(
        await service.setPortalAutopay(
          "lead@analytical.example",
          client.id,
          false
        )
      ).toEqual({
        ok: false,
        error: "Only billing contacts can manage autopay and cards.",
      })
      expectOk(
        await service.setPortalAutopay(clientInput.email, client.id, false)
      )
    })

    it("removes access as soon as a contact is removed", async () => {
      const { service } = setup()
      const client = expectOk(await service.createClient(clientInput))
      expectOk(
        await service.addContact(
          client.id,
          { email: "lead@analytical.example", name: "Lead", role: "viewer" },
          staff
        )
      )

      expectOk(
        await service.removeContact(client.id, "lead@analytical.example", staff)
      )

      expect(
        await service.portalRoleFor("lead@analytical.example", client.id)
      ).toBeNull()
    })
  })

  it("re-sends an issued invoice to the billing contacts and logs it", async () => {
    const { service, notifier } = setup()
    const { draft } = await draftFor(service)
    expectOk(await service.issue(draft.id, ADMIN))

    const resent = expectOk(await service.resendInvoice(draft.id, ADMIN))

    expect(notifier.sent.map((message) => message.kind)).toEqual([
      "issued",
      "issued",
    ])
    expect(resent.events.filter((event) => event.type === "sent")).toHaveLength(
      2
    )
  })

  it("doesn't send drafts or voided invoices", async () => {
    const { service } = setup()
    const { draft } = await draftFor(service)

    expect(await service.resendInvoice(draft.id, ADMIN)).toEqual({
      ok: false,
      error: "Only open invoices can be sent.",
    })
  })
})
