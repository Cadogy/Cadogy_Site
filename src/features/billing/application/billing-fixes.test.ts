import { describe, expect, it } from "vitest"

import { dueReminders } from "../domain/collections"
import { DAY_MS } from "../domain/dates"
import type { Invoice } from "../domain/invoice"
import { buildLineItem } from "../domain/test-factories"
import { calculateInvoiceTotals } from "../domain/totals"
import { renderBillingEmail } from "../email/templates"
import { issuedFeedback } from "../server/issue-feedback"
import { createBillingService } from "./billing-service"
import { createCredits } from "./credits"
import { createBillingEngine } from "./engine"
import type { ChargeResult } from "./engine-ports"
import {
  createFakeGateway,
  createInMemoryEngineRepository,
} from "./engine-test-doubles"
import type { BillingNotification, BillingNotifier } from "./ports"
import {
  createInMemoryBillingRepository,
  createInMemoryCreditNotes,
} from "./test-doubles"

const ADMIN = "admin_1"
const day = (iso: string) => new Date(`${iso}T09:00:00.000Z`)

/**
 * Billing, credits and the engine wired together the way production wires
 * them, with fakes only at the edges: storage, email and the card gateway.
 */
const setup = (
  options: {
    card?: (attempt: number) => ChargeResult
    emailFails?: boolean
    onRefund?: (refundId: string) => Promise<void>
  } = {}
) => {
  let now = day("2026-11-02")
  const sent: BillingNotification[] = []
  const notifier: BillingNotifier = {
    send: async (notification) => {
      if (options.emailFails) throw new Error("smtp down")
      sent.push(notification)
    },
  }
  const repository = createInMemoryBillingRepository()
  let tokens = 0
  const billing = createBillingService({
    repository,
    notifier,
    clock: () => now,
    generateToken: () => `tok_${++tokens}`,
  })
  let refunds = 0
  const credits = createCredits({
    billing,
    billingRepository: repository,
    repository: createInMemoryCreditNotes(),
    clock: () => now,
    gateway: {
      refund: async () => {
        const refundId = `re_${++refunds}`
        await options.onRefund?.(refundId)
        return { ok: true, refundId }
      },
    },
  })
  let attempt = 0
  const { gateway, attempts } = createFakeGateway(() =>
    (options.card ?? (() => ({ ok: true, paymentId: "pi_auto" })))(++attempt)
  )
  const engineRepository = createInMemoryEngineRepository()
  const engine = createBillingEngine({
    billing,
    repository: engineRepository,
    gateway,
    clock: () => now,
    applyCredit: (invoiceId, actorId) =>
      credits.applyBalance(invoiceId, actorId),
  })
  return {
    billing,
    credits,
    engine,
    repository,
    engineRepository,
    sent,
    attempts,
    setNow: (iso: string) => {
      now = day(iso)
    },
  }
}

type Setup = ReturnType<typeof setup>

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(result.error)
  return result.value
}

const newClient = async ({ billing }: Setup, currency = "USD") =>
  expectOk(
    await billing.createClient({
      name: "Ada",
      company: "Analytical",
      email: "ada@example.com",
      currency,
    })
  )

const withCard = async ({ repository }: Setup, clientId: string) => {
  const client = await repository.findClient(clientId)
  if (!client) throw new Error("client missing")
  await repository.saveClient({
    ...client,
    autopay: {
      enabled: true,
      card: {
        stripeCustomerId: "cus_1",
        paymentMethodId: "pm_1",
        brand: "Visa",
        last4: "4242",
        expMonth: 1,
        expYear: 2030,
      },
    },
  })
}

const draftFor = async (
  { billing }: Setup,
  clientId: string,
  unitAmount = 10_000,
  extra: Record<string, unknown> = {}
) =>
  expectOk(
    await billing.createDraft(
      {
        clientId,
        lineItems: [buildLineItem({ quantity: 1, unitAmount })],
        ...extra,
      },
      ADMIN
    )
  )

const issued = async (context: Setup, unitAmount = 10_000) => {
  const client = await newClient(context)
  const draft = await draftFor(context, client.id, unitAmount)
  return {
    client,
    invoice: expectOk(await context.engine.issueAndCollect(draft.id, ADMIN))
      .invoice,
  }
}

describe("card payments that can't go on their invoice", () => {
  it("credits the client instead of dropping a payment on a voided invoice", async () => {
    const context = setup()
    const { client, invoice } = await issued(context)
    expectOk(await context.billing.voidInvoice(invoice.id, ADMIN))

    const result = expectOk(
      await context.credits.settleCardPayment({
        invoiceId: invoice.id,
        amount: 10_000,
        eventId: "evt_1",
        paidAt: day("2026-11-03"),
        paymentIntentId: "pi_late",
      })
    )

    expect(result).toMatchObject({ applied: 0, credited: 10_000 })
    expect(await context.credits.balanceFor(client.id, "USD")).toBe(10_000)
  })

  it("pays what's owed and credits only the overpayment", async () => {
    const context = setup()
    const { client, invoice } = await issued(context)
    expectOk(
      await context.billing.recordPayment(
        invoice.id,
        { amount: 4_000, method: "bank_transfer", paidAt: "2026-11-02" },
        ADMIN
      )
    )

    const result = expectOk(
      await context.credits.settleCardPayment({
        invoiceId: invoice.id,
        amount: 10_000,
        eventId: "evt_2",
        paidAt: day("2026-11-03"),
        paymentIntentId: "pi_over",
      })
    )

    expect(result).toMatchObject({ applied: 6_000, credited: 4_000 })
    expect(result.invoice.status).toBe("paid")
    expect(await context.credits.balanceFor(client.id, "USD")).toBe(4_000)
  })

  it("is safe to retry: a redelivered webhook credits nothing twice", async () => {
    const context = setup()
    const { client, invoice } = await issued(context)
    const payment = {
      invoiceId: invoice.id,
      amount: 15_000,
      eventId: "evt_3",
      paidAt: day("2026-11-03"),
      paymentIntentId: "pi_retry",
    }

    expectOk(await context.credits.settleCardPayment(payment))
    expectOk(await context.credits.settleCardPayment(payment))

    const paid = await context.billing.getInvoice(invoice.id)
    expect(paid?.payments).toHaveLength(1)
    expect(await context.credits.balanceFor(client.id, "USD")).toBe(5_000)
  })
})

describe("refunds", () => {
  it("records a refund once even when Stripe's webhook lands first", async () => {
    let credits: Setup["credits"] | null = null
    const context = setup({
      onRefund: async (refundId) => {
        // Stripe's refund.created webhook arrives before the API returns.
        await credits?.recordStripeRefund({
          paymentIntentId: "pi_paid",
          refundId,
          amount: 3_000,
        })
      },
    })
    credits = context.credits
    const { invoice } = await issued(context)
    expectOk(
      await context.billing.recordStripePayment({
        invoiceId: invoice.id,
        amount: 10_000,
        eventId: "evt_pay",
        paidAt: day("2026-11-02"),
        paymentIntentId: "pi_paid",
      })
    )

    expectOk(
      await context.credits.refundInvoice(
        { invoiceId: invoice.id, amount: 3_000, reason: "Partial refund" },
        ADMIN
      )
    )

    const refunded = await context.billing.getInvoice(invoice.id)
    expect(refunded?.adjustments).toHaveLength(1)
    expect(
      await context.credits.notesFor({ invoiceId: invoice.id })
    ).toHaveLength(1)
  })
})

describe("issuing", () => {
  it("applies credit before emailing, and sends no receipt for credit", async () => {
    const context = setup()
    const client = await newClient(context)
    expectOk(
      await context.credits.creditBalance(
        {
          clientId: client.id,
          amount: 4_000,
          currency: "USD",
          reason: "Goodwill",
        },
        ADMIN
      )
    )
    const draft = await draftFor(context, client.id)

    const result = expectOk(
      await context.engine.issueAndCollect(draft.id, ADMIN)
    )

    expect(context.sent.map((message) => message.kind)).toEqual(["issued"])
    const emailed = context.sent[0]!.invoice
    expect(calculateInvoiceTotals(emailed).amountDue).toBe(6_000)
    expect(
      (
        await renderBillingEmail({
          kind: "issued",
          invoice: emailed,
          baseUrl: "https://cadogy.com",
        })
      ).text
    ).toContain("We applied $40.00 of your account credit")
    expect(issuedFeedback([result]).message).toBe(
      "Invoice issued and emailed. Credit balance applied."
    )
  })

  it("tells the client an invoice paid entirely from credit needs nothing", async () => {
    const context = setup()
    const client = await newClient(context)
    expectOk(
      await context.credits.creditBalance(
        {
          clientId: client.id,
          amount: 20_000,
          currency: "USD",
          reason: "Prepaid",
        },
        ADMIN
      )
    )
    const draft = await draftFor(context, client.id)

    const { invoice } = expectOk(
      await context.engine.issueAndCollect(draft.id, ADMIN)
    )

    expect(invoice.status).toBe("paid")
    expect(
      (
        await renderBillingEmail({
          kind: "issued",
          invoice: context.sent[0]!.invoice,
          baseUrl: "https://cadogy.com",
        })
      ).subject
    ).toContain("paid from your credit")
  })

  it("charges the saved card when staff issue an invoice by hand", async () => {
    const context = setup()
    const client = await newClient(context)
    await withCard(context, client.id)
    const draft = await draftFor(context, client.id)

    const result = expectOk(
      await context.engine.issueAndCollect(draft.id, ADMIN)
    )

    expect(result.autopay).toBe("collected")
    expect(result.invoice.status).toBe("paid")
    expect(context.attempts).toEqual([{ amount: 10_000, invoiceId: draft.id }])
  })

  it("says so when the email to the client fails", async () => {
    const context = setup({ emailFails: true })
    const client = await newClient(context)
    const draft = await draftFor(context, client.id)

    const result = expectOk(
      await context.engine.issueAndCollect(draft.id, ADMIN)
    )
    const reminded = expectOk(
      await context.billing.sendReminder(draft.id, ADMIN)
    )

    expect(result.emailed).toBe(false)
    expect(issuedFeedback([result])).toMatchObject({ ok: false })
    expect(issuedFeedback([result]).message).toContain(
      "the email to the client failed"
    )
    expect(reminded.events.at(-1)?.type).not.toBe("reminder_sent")
  })

  it("uses a fixed due date instead of the payment terms", async () => {
    const context = setup()
    const client = await newClient(context)
    const draft = await draftFor(context, client.id)
    expectOk(
      await context.billing.updateDraftInvoice(
        draft.id,
        {
          clientId: client.id,
          currency: "USD",
          termsDays: 15,
          lineItems: draft.lineItems,
          dueDate: "2026-12-31",
        },
        ADMIN
      )
    )

    const { invoice } = expectOk(
      await context.engine.issueAndCollect(draft.id, ADMIN)
    )

    expect(invoice.dueDate?.toISOString().slice(0, 10)).toBe("2026-12-31")
  })

  it("refuses to issue with a due date in the past", async () => {
    const context = setup()
    const client = await newClient(context)
    const draft = await draftFor(context, client.id)
    expectOk(
      await context.billing.updateDraftInvoice(
        draft.id,
        {
          clientId: client.id,
          currency: "USD",
          termsDays: 15,
          lineItems: draft.lineItems,
          dueDate: "2026-10-01",
        },
        ADMIN
      )
    )

    expect(await context.engine.issueAndCollect(draft.id, ADMIN)).toMatchObject(
      {
        ok: false,
        error: expect.stringContaining("due date is in the past"),
      }
    )
  })
})

describe("autopay retries", () => {
  it("retries a declined card every few days, up to three attempts", async () => {
    const context = setup({
      card: () => ({ ok: false, error: "card_declined" }),
    })
    const client = await newClient(context)
    await withCard(context, client.id)
    const draft = await draftFor(context, client.id)
    expectOk(await context.engine.issueAndCollect(draft.id, ADMIN))
    expect(context.attempts).toHaveLength(1)

    context.setNow("2026-11-03")
    await context.engine.runBilling()
    expect(context.attempts).toHaveLength(1) // too soon to retry

    context.setNow("2026-11-05")
    const second = await context.engine.runBilling()
    expect(second.autopayFailed).toBe(1)
    context.setNow("2026-11-08")
    await context.engine.runBilling()
    context.setNow("2026-11-12")
    await context.engine.runBilling()

    expect(context.attempts).toHaveLength(3)
    const invoice = await context.billing.getInvoice(draft.id)
    expect(
      invoice?.events.filter((event) => event.type === "autopay_failed")
    ).toHaveLength(3)
  })

  it("collects on retry once the card works again", async () => {
    const context = setup({
      card: (attempt) =>
        attempt === 1
          ? { ok: false, error: "insufficient_funds" }
          : { ok: true, paymentId: "pi_retry" },
    })
    const client = await newClient(context)
    await withCard(context, client.id)
    const draft = await draftFor(context, client.id)
    expectOk(await context.engine.issueAndCollect(draft.id, ADMIN))

    context.setNow("2026-11-05")
    const summary = await context.engine.runBilling()

    expect(summary.autopayCollected).toBe(1)
    expect((await context.billing.getInvoice(draft.id))?.status).toBe("paid")
  })

  it("lets staff charge the saved card on demand", async () => {
    const context = setup()
    const client = await newClient(context)
    const draft = await draftFor(context, client.id)
    expectOk(await context.engine.issueAndCollect(draft.id, ADMIN))
    expect(await context.engine.chargeSavedCard(draft.id)).toMatchObject({
      ok: false,
    })

    await withCard(context, client.id)

    expect(await context.engine.chargeSavedCard(draft.id)).toEqual({
      ok: true,
      value: "collected",
    })
  })
})

describe("archived clients", () => {
  it("pause their services and get no new charges or reminders", async () => {
    const context = setup()
    const client = await newClient(context)
    expectOk(
      await context.engine.addAddOn(client.id, {
        name: "Hosting",
        unitAmount: 2_000,
        interval: "month",
        startDate: "2026-11-10",
      })
    )
    const { invoice } = expectOk(
      await context.engine.issueAndCollect(
        (await draftFor(context, client.id)).id,
        ADMIN
      )
    )

    expectOk(await context.engine.archiveClient(client.id))
    context.setNow("2026-12-30")
    const summary = await context.engine.runBilling()

    const [service] = await context.engine.listAddOns(client.id)
    expect(service?.status).toBe("paused")
    expect(summary.chargesCreated).toBe(0)
    expect(summary.remindersSent).toBe(0)
    expect(
      (await context.billing.getInvoice(invoice.id))?.events.some(
        (event) => event.type === "reminder_sent"
      )
    ).toBe(false)
  })
})

describe("reminders", () => {
  it("doesn't send a scheduled reminder on top of a manual one", () => {
    const due = day("2026-11-10")
    const invoice = {
      status: "open",
      dueDate: due,
      events: [
        {
          type: "reminder_sent",
          at: new Date(due.getTime() + 2 * DAY_MS),
          actorId: ADMIN,
        },
      ],
    } as unknown as Invoice

    expect(
      dueReminders(invoice, new Date(due.getTime() + 2 * DAY_MS), [0])
    ).toEqual([])
    expect(
      dueReminders(invoice, new Date(due.getTime() + 7 * DAY_MS), [0, 7])
    ).toEqual([7])
  })
})

describe("uncollectible invoices", () => {
  it("can still be paid from the client portal", async () => {
    const context = setup()
    const { invoice } = await issued(context)
    expectOk(await context.billing.markUncollectible(invoice.id, ADMIN))

    expect(
      await context.engine.preparePayment("ada@example.com", [invoice.id])
    ).toEqual({
      ok: true,
      value: { invoiceIds: [invoice.id], amount: 10_000, currency: "USD" },
    })
  })
})

describe("editing what's billed", () => {
  it("edits a pending charge, but not one already invoiced", async () => {
    const context = setup()
    const client = await newClient(context)
    const charge = expectOk(
      await context.engine.addCharge(client.id, {
        description: "Logo",
        unitAmount: 50_000,
      })
    )

    const edited = expectOk(
      await context.engine.updateCharge(charge.id, {
        description: "Logo refresh",
        unitAmount: 45_000,
        quantity: 2,
      })
    )
    expect(edited).toMatchObject({
      description: "Logo refresh",
      unitAmount: 45_000,
      quantity: 2,
    })

    expectOk(await context.engine.invoiceCharges(client.id, "all", ADMIN))
    expect(
      await context.engine.updateCharge(charge.id, {
        description: "Too late",
        unitAmount: 1,
      })
    ).toEqual({ ok: false, error: "Only pending charges can be edited" })
  })

  it("renames, re-prices and reschedules a service", async () => {
    const context = setup()
    const client = await newClient(context)
    const service = expectOk(
      await context.engine.addAddOn(client.id, {
        name: "Email",
        unitAmount: 800,
        interval: "month",
        startDate: "2026-11-15",
      })
    )

    const changed = expectOk(
      await context.engine.updateAddOn(service.id, {
        name: "Business email",
        interval: "year",
        nextBillingDate: "2027-01-01",
      })
    )

    expect(changed).toMatchObject({
      name: "Business email",
      interval: "year",
      anchorDay: 1,
      unitAmount: 800,
    })
    expect(changed.nextBillingDate.toISOString().slice(0, 10)).toBe(
      "2027-01-01"
    )
    expect(
      await context.engine.updateAddOn(service.id, {
        nextBillingDate: "2026-10-01",
      })
    ).toEqual({
      ok: false,
      error: "The next billing date can't be in the past",
    })
  })

  it("won't add a catalog service priced in another currency", async () => {
    const context = setup()
    const client = await newClient(context, "EUR")
    const item = expectOk(
      await context.engine.createCatalogItem({
        name: "Hosting",
        unitAmount: 2_000,
        interval: "month",
        currency: "USD",
      })
    )

    expect(
      await context.engine.addAddOn(client.id, { catalogItemId: item.id })
    ).toMatchObject({
      ok: false,
      error: expect.stringContaining("priced in USD"),
    })
  })
})
