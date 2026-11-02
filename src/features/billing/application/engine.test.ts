import { describe, expect, it } from "vitest"

import { calculateInvoiceTotals } from "../domain/totals"
import { createBillingService } from "./billing-service"
import { createBillingEngine } from "./engine"
import type { ChargeResult } from "./engine-ports"
import {
  createFakeGateway,
  createInMemoryEngineRepository,
} from "./engine-test-doubles"
import {
  createInMemoryBillingRepository,
  createRecordingNotifier,
} from "./test-doubles"

const day = (iso: string) => new Date(`${iso}T09:00:00.000Z`)
const ADMIN = "admin_1"

const setup = (
  options: {
    charge?: (amount: number) => ChargeResult
    credit?: number
  } = {}
) => {
  let now = day("2026-11-01")
  const repository = createInMemoryBillingRepository()
  const engineRepository = createInMemoryEngineRepository()
  const notifier = createRecordingNotifier()
  const { gateway, attempts } = createFakeGateway(
    options.charge ?? (() => ({ ok: true, paymentId: "pi_1" }))
  )
  let token = 0
  const billing = createBillingService({
    repository,
    notifier,
    clock: () => now,
    generateToken: () => `tok_${++token}`,
  })
  const engine = createBillingEngine({
    billing,
    repository: engineRepository,
    gateway,
    clock: () => now,
    applyCredit: options.credit
      ? async (invoiceId) => {
          await billing.recordCreditPayment(
            invoiceId,
            options.credit ?? 0,
            "Credit balance",
            "system"
          )
        }
      : undefined,
  })
  const setNow = (iso: string) => {
    now = day(iso)
  }
  return {
    billing,
    engine,
    repository,
    engineRepository,
    notifier,
    attempts,
    setNow,
  }
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(result.error)
  return result.value
}

const newClient = async (
  billing: ReturnType<typeof setup>["billing"],
  email = "ada@example.com"
) =>
  expectOk(
    await billing.createClient({ name: "Ada", email, company: "Analytical" })
  )

const emailAddOn = {
  name: "Business email",
  unitAmount: 800,
  quantity: 3,
  interval: "month",
  startDate: "2026-11-01",
}

describe("billing engine", () => {
  it("adds services from the catalog with a price snapshot", async () => {
    const { billing, engine } = setup()
    const client = await newClient(billing)
    const item = expectOk(
      await engine.createCatalogItem({
        name: "Business email",
        description: "Per user",
        unitAmount: 800,
        interval: "month",
      })
    )

    const addOn = expectOk(
      await engine.addAddOn(client.id, {
        catalogItemId: item.id,
        quantity: 2,
        startDate: "2026-11-15",
      })
    )
    expectOk(
      await engine.updateCatalogItem(item.id, { ...item, unitAmount: 999 })
    )

    expect(addOn).toMatchObject({
      name: "Business email",
      unitAmount: 800,
      quantity: 2,
      interval: "month",
      anchorDay: 15,
      status: "active",
    })
    expect(addOn.nextBillingDate.toISOString().slice(0, 10)).toBe("2026-11-15")
  })

  it("rejects add-ons that are missing a price or name", async () => {
    const { billing, engine } = setup()
    const client = await newClient(billing)
    expect(
      await engine.addAddOn(client.id, {
        name: "",
        unitAmount: 0,
        interval: "month",
      })
    ).toMatchObject({ ok: false })
  })

  it("bills everything a client owes today on one invoice, issues it and emails it", async () => {
    const { billing, engine, notifier, engineRepository } = setup()
    const client = await newClient(billing)
    expectOk(await engine.addAddOn(client.id, emailAddOn))
    expectOk(
      await engine.addAddOn(client.id, {
        name: "Hosting",
        unitAmount: 2_000,
        interval: "month",
        startDate: "2026-11-01",
      })
    )

    const summary = await engine.runBilling()

    expect(summary).toMatchObject({
      chargesCreated: 2,
      invoicesIssued: 1,
      errors: [],
    })
    const [invoice] = await billing.listInvoices({ clientIds: [client.id] })
    expect(invoice?.status).toBe("open")
    expect(invoice?.lineItems.map((line) => line.description)).toEqual([
      "Business email × 3 (Nov 1 – Nov 30, 2026)",
      "Hosting (Nov 1 – Nov 30, 2026)",
    ])
    expect(calculateInvoiceTotals(invoice!).total).toBe(4_400)
    expect(notifier.sent.map((message) => message.kind)).toEqual(["issued"])
    expect(await engineRepository.charges.list({ status: "pending" })).toEqual(
      []
    )
    expect((await engineRepository.runs.latest())?.invoicesIssued).toBe(1)
  })

  it("is safe to run more than once a day", async () => {
    const { billing, engine } = setup()
    const client = await newClient(billing)
    expectOk(await engine.addAddOn(client.id, emailAddOn))

    await engine.runBilling()
    const second = await engine.runBilling()

    expect(second).toMatchObject({ chargesCreated: 0, invoicesIssued: 0 })
    expect(await billing.listInvoices({ clientIds: [client.id] })).toHaveLength(
      1
    )
  })

  it("bills the next period on its renewal date", async () => {
    const { billing, engine, setNow } = setup()
    const client = await newClient(billing)
    expectOk(await engine.addAddOn(client.id, emailAddOn))
    await engine.runBilling()

    setNow("2026-12-01")
    await engine.runBilling()

    const invoices = await billing.listInvoices({ clientIds: [client.id] })
    expect(
      invoices.map((invoice) => invoice.lineItems[0]?.description).sort()
    ).toEqual([
      "Business email × 3 (Dec 1 – Dec 31, 2026)",
      "Business email × 3 (Nov 1 – Nov 30, 2026)",
    ])
  })

  it("holds charges for clients who are billed manually", async () => {
    const { billing, engine, engineRepository, repository } = setup()
    const client = await newClient(billing)
    await repository.saveClient({ ...client, autoBill: false })
    expectOk(await engine.addAddOn(client.id, emailAddOn))

    const summary = await engine.runBilling()

    expect(summary).toMatchObject({ chargesCreated: 1, invoicesIssued: 0 })
    expect(
      await engineRepository.charges.list({
        clientId: client.id,
        status: "pending",
      })
    ).toHaveLength(1)
  })

  it("lets an admin bill selected charges on their own", async () => {
    const { billing, engine, repository } = setup()
    const client = await newClient(billing)
    await repository.saveClient({ ...client, autoBill: false })
    const first = expectOk(
      await engine.addCharge(client.id, {
        description: "Logo refresh",
        unitAmount: 50_000,
      })
    )
    expectOk(
      await engine.addCharge(client.id, {
        description: "Extra mailbox",
        unitAmount: 800,
      })
    )

    const [invoice] = expectOk(
      await engine.invoiceCharges(client.id, [first.id], ADMIN)
    )

    expect(invoice?.lineItems.map((line) => line.description)).toEqual([
      "Logo refresh",
    ])
    const pending = await engine.pendingCharges(client.id)
    expect(pending.map((charge) => charge.description)).toEqual([
      "Extra mailbox",
    ])
  })

  it("uses the billing settings for tax and payment instructions", async () => {
    const { billing, engine } = setup()
    expectOk(
      await engine.saveSettings({
        paymentInstructions: "Wire to account 123",
        defaultTaxRateBps: 700,
        reminderOffsets: [0],
        autoBillEnabled: true,
      })
    )
    const client = await newClient(billing)
    expectOk(
      await engine.addCharge(client.id, {
        description: "Audit",
        unitAmount: 10_000,
      })
    )

    await engine.runBilling()

    const [invoice] = await billing.listInvoices({ clientIds: [client.id] })
    expect(invoice?.memo).toBe("Wire to account 123")
    expect(calculateInvoiceTotals(invoice!).total).toBe(10_700)
  })

  it("collects renewals automatically from a saved card", async () => {
    const { billing, engine, repository, attempts, notifier } = setup()
    const client = await newClient(billing)
    await repository.saveClient({
      ...client,
      autopay: {
        enabled: true,
        card: {
          stripeCustomerId: "cus_1",
          paymentMethodId: "pm_1",
          brand: "visa",
          last4: "4242",
          expMonth: 1,
          expYear: 2030,
        },
      },
    })
    expectOk(await engine.addAddOn(client.id, emailAddOn))

    const summary = await engine.runBilling()

    expect(summary.autopayCollected).toBe(1)
    expect(attempts).toEqual([{ amount: 2_400, invoiceId: expect.any(String) }])
    const [invoice] = await billing.listInvoices({ clientIds: [client.id] })
    expect(invoice?.status).toBe("paid")
    expect(notifier.sent.map((message) => message.kind)).toEqual([
      "issued",
      "receipt",
    ])
  })

  it("asks the client to pay manually when the saved card fails", async () => {
    const { billing, engine, repository, notifier } = setup({
      charge: () => ({ ok: false, error: "card_declined" }),
    })
    const client = await newClient(billing)
    await repository.saveClient({
      ...client,
      autopay: {
        enabled: true,
        card: {
          stripeCustomerId: "cus_1",
          paymentMethodId: "pm_1",
          brand: "visa",
          last4: "4242",
          expMonth: 1,
          expYear: 2030,
        },
      },
    })
    expectOk(await engine.addAddOn(client.id, emailAddOn))

    const summary = await engine.runBilling()

    expect(summary.autopayFailed).toBe(1)
    const [invoice] = await billing.listInvoices({ clientIds: [client.id] })
    expect(invoice?.status).toBe("open")
    expect(notifier.sent.map((message) => message.kind)).toEqual([
      "issued",
      "autopay_failed",
    ])
  })

  it("sends scheduled reminders once each", async () => {
    const { billing, engine, notifier, setNow } = setup()
    const client = await newClient(billing)
    expectOk(
      await engine.addCharge(client.id, {
        description: "Audit",
        unitAmount: 10_000,
      })
    )
    await engine.runBilling()

    setNow("2026-11-13")
    const first = await engine.runBilling()
    const again = await engine.runBilling()

    expect(first.remindersSent).toBe(1)
    expect(again.remindersSent).toBe(0)
    expect(
      notifier.sent.filter((message) => message.kind === "reminder")
    ).toHaveLength(1)
  })

  it("skips periods while an add-on is paused and resumes on schedule", async () => {
    const { billing, engine, setNow } = setup()
    const client = await newClient(billing)
    const addOn = expectOk(await engine.addAddOn(client.id, emailAddOn))
    await engine.runBilling()
    expectOk(await engine.setAddOnStatus(addOn.id, "paused"))

    setNow("2027-02-10")
    await engine.runBilling()
    expect(await billing.listInvoices({ clientIds: [client.id] })).toHaveLength(
      1
    )

    const resumed = expectOk(await engine.setAddOnStatus(addOn.id, "active"))
    expect(resumed.nextBillingDate.toISOString().slice(0, 10)).toBe(
      "2027-03-01"
    )
  })

  it("stops billing a canceled add-on", async () => {
    const { billing, engine, setNow } = setup()
    const client = await newClient(billing)
    const addOn = expectOk(await engine.addAddOn(client.id, emailAddOn))
    await engine.runBilling()
    expectOk(await engine.setAddOnStatus(addOn.id, "canceled"))

    setNow("2027-01-01")
    await engine.runBilling()

    expect(await billing.listInvoices({ clientIds: [client.id] })).toHaveLength(
      1
    )
  })

  it("lets a client pay several invoices in one payment", async () => {
    const { billing, engine } = setup()
    const client = await newClient(billing)
    expectOk(
      await engine.addCharge(client.id, {
        description: "Audit",
        unitAmount: 10_000,
      })
    )
    await engine.runBilling()
    expectOk(
      await engine.addCharge(client.id, {
        description: "Hosting",
        unitAmount: 5_000,
      })
    )
    await engine.runBilling()
    const invoices = await billing.listInvoices({ clientIds: [client.id] })

    const prepared = expectOk(
      await engine.preparePayment(
        "ada@example.com",
        invoices.map((invoice) => invoice.id)
      )
    )
    expect(prepared).toMatchObject({ amount: 15_000, currency: "USD" })

    const applied = expectOk(
      await engine.applyBatchPayment({
        invoiceIds: prepared.invoiceIds,
        amount: 15_000,
        eventId: "evt_9",
        paidAt: day("2026-11-02"),
      })
    )
    expect(applied.unallocated).toBe(0)
    const after = await billing.listInvoices({ clientIds: [client.id] })
    expect(after.every((invoice) => invoice.status === "paid")).toBe(true)
  })

  it("refuses to pay invoices that belong to someone else", async () => {
    const { billing, engine } = setup()
    const mine = await newClient(billing)
    await newClient(billing, "eve@example.com")
    expectOk(
      await engine.addCharge(mine.id, {
        description: "Audit",
        unitAmount: 10_000,
      })
    )
    await engine.runBilling()
    const [invoice] = await billing.listInvoices({ clientIds: [mine.id] })

    expect(
      await engine.preparePayment("eve@example.com", [invoice!.id])
    ).toMatchObject({ ok: false })
  })

  it("reports monthly recurring revenue across intervals", async () => {
    const { billing, engine } = setup()
    const client = await newClient(billing)
    expectOk(await engine.addAddOn(client.id, emailAddOn))
    expectOk(
      await engine.addAddOn(client.id, {
        name: "Domain",
        unitAmount: 1_200,
        interval: "year",
        startDate: "2026-11-01",
      })
    )

    expect(await engine.monthlyRecurringRevenue()).toEqual({ USD: 2_500 })
  })

  it("applies credit before charging a saved card", async () => {
    const { billing, engine, repository, attempts } = setup({ credit: 2_400 })
    const client = await newClient(billing)
    await repository.saveClient({
      ...client,
      autopay: {
        enabled: true,
        card: {
          stripeCustomerId: "cus_1",
          paymentMethodId: "pm_1",
          brand: "visa",
          last4: "4242",
          expMonth: 1,
          expYear: 2030,
        },
      },
    })
    expectOk(await engine.addAddOn(client.id, emailAddOn))

    const summary = await engine.runBilling()

    expect(summary.autopayCollected).toBe(0)
    expect(attempts).toEqual([])
    const [invoice] = await billing.listInvoices({ clientIds: [client.id] })
    expect(invoice?.status).toBe("paid")
  })
})
