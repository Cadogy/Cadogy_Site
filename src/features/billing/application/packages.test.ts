import { describe, expect, it } from "vitest"

import { createBillingService } from "./billing-service"
import { createBillingEngine, loggedTimeMessage } from "./engine"
import {
  createFakeGateway,
  createInMemoryEngineRepository,
} from "./engine-test-doubles"
import {
  createInMemoryBillingRepository,
  createRecordingNotifier,
} from "./test-doubles"

const ADMIN = "admin_1"

const setup = (now = "2026-11-26T09:00:00.000Z") => {
  const clock = { now: new Date(now) }
  let token = 0
  const repository = createInMemoryEngineRepository()
  const billing = createBillingService({
    repository: createInMemoryBillingRepository(),
    notifier: createRecordingNotifier(),
    clock: () => clock.now,
    generateToken: () => `tok_${++token}`,
  })
  const engine = createBillingEngine({
    billing,
    repository,
    gateway: createFakeGateway(() => ({ ok: true, paymentId: "pi_1" })).gateway,
    clock: () => clock.now,
  })
  return { billing, engine, repository, clock }
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(result.error)
  return result.value
}

/** A client on Business Care (3 h a month from Nov 15) with a $150/h service. */
const withPlan = async (now?: string) => {
  const context = setup(now)
  const { billing, engine } = context
  const client = expectOk(
    await billing.createClient({ name: "Ada", email: "ada@example.com" })
  )
  const hosting = expectOk(
    await engine.createCatalogItem({
      name: "Managed Website Hosting",
      unitAmount: 4_900,
      interval: "month",
    })
  )
  const development = expectOk(
    await engine.createCatalogItem({
      name: "Custom Development",
      pricing: "hourly",
      unitAmount: 15_000,
      interval: "one_time",
    })
  )
  const plan = expectOk(
    await engine.createCatalogItem({
      name: "Business Care",
      unitAmount: 74_900,
      interval: "month",
      includedItemIds: [hosting.id],
      includedHours: 3,
    })
  )
  const addOn = expectOk(
    await engine.addAddOn(client.id, {
      catalogItemId: plan.id,
      startDate: "2026-11-15",
    })
  )
  return { ...context, client, hosting, development, plan, addOn }
}

describe("package contents", () => {
  it("stores the included services and hours", async () => {
    const { plan, hosting } = await withPlan()
    expect(plan).toMatchObject({
      includedItemIds: [hosting.id],
      includedHours: 3,
    })
  })

  it("rejects included services that don't exist and drops itself", async () => {
    const { engine, plan, hosting } = await withPlan()
    expect(
      await engine.updateCatalogItem(plan.id, {
        name: "Business Care",
        unitAmount: 74_900,
        interval: "month",
        includedItemIds: ["missing"],
      })
    ).toEqual({
      ok: false,
      error: "An included service is no longer in the catalog",
    })
    const saved = expectOk(
      await engine.updateCatalogItem(plan.id, {
        name: "Business Care",
        unitAmount: 74_900,
        interval: "month",
        includedItemIds: [plan.id, hosting.id, hosting.id],
      })
    )
    expect(saved.includedItemIds).toEqual([hosting.id])
  })

  it("needs a recurring schedule for included hours", async () => {
    const { engine } = setup()
    const result = await engine.createCatalogItem({
      name: "Launch bundle",
      unitAmount: 100_000,
      interval: "one_time",
      includedHours: 5,
    })
    expect(result.ok).toBe(false)
  })

  it("copies the included hours onto the client's service", async () => {
    const { addOn } = await withPlan()
    expect(addOn.includedHours).toBe(3)
  })
})

describe("logging time against a plan", () => {
  it("covers time inside the allowance without billing anything", async () => {
    const { engine, client } = await withPlan()
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-11-20",
        hours: 2,
        description: "Updated the pricing page",
      })
    )

    expect(logged.entry).toMatchObject({
      includedHours: 2,
      billedHours: 0,
      chargeId: null,
    })
    expect(await engine.pendingCharges(client.id)).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ unit: "hour" })])
    )
    expect(loggedTimeMessage(logged)).toBe(
      "Time logged. 2 h covered by Business Care."
    )
  })

  it("bills the hours beyond the allowance at the service's rate", async () => {
    const { engine, client, development } = await withPlan()
    await engine.logTime(client.id, {
      date: "2026-11-18",
      hours: 2,
      description: "Bug fixes",
    })
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-11-25",
        hours: 2.5,
        description: "New contact form",
        catalogItemId: development.id,
      })
    )

    expect(logged.entry).toMatchObject({ includedHours: 1, billedHours: 1.5 })
    const charges = await engine.pendingCharges(client.id)
    const hourCharge = charges.find((charge) => charge.unit === "hour")
    expect(hourCharge).toMatchObject({
      quantity: 1.5,
      unitAmount: 15_000,
      description:
        "Custom Development: New contact form (Nov 25, 2026, beyond Business Care hours)",
    })
    expect(loggedTimeMessage(logged)).toBe(
      "Time logged. 1 h covered by Business Care; 1.5 h added to the next invoice."
    )
  })

  it("starts each billing period with a fresh allowance", async () => {
    const { engine, client, clock } = await withPlan()
    await engine.logTime(client.id, {
      date: "2026-11-20",
      hours: 3,
      description: "November work",
    })
    clock.now = new Date("2026-12-16T09:00:00.000Z")
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-12-16",
        hours: 1,
        description: "December work",
      })
    )

    expect(logged.entry.includedHours).toBe(1)
    const overview = await engine.hoursOverview(client.id)
    expect(overview.allowances).toEqual([
      expect.objectContaining({ used: 1, allowance: 3, remaining: 2 }),
    ])
  })

  it("can bill out-of-scope work without touching plan hours", async () => {
    const { engine, client, development } = await withPlan()
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-11-26",
        hours: 1,
        description: "Emergency restore",
        catalogItemId: development.id,
        billSeparately: true,
      })
    )
    expect(logged.entry).toMatchObject({ includedHours: 0, billedHours: 1 })
  })

  it("refuses billable time with no rate, before saving anything", async () => {
    const { engine, client } = await withPlan()
    const result = await engine.logTime(client.id, {
      date: "2026-11-26",
      hours: 4,
      description: "Too much work",
    })
    expect(result.ok).toBe(false)
    expect((await engine.hoursOverview(client.id)).entries).toEqual([])
  })

  it("refuses future dates and more than a day's hours", async () => {
    const { engine, client } = await withPlan()
    expect(
      (
        await engine.logTime(client.id, {
          date: "2026-11-27",
          hours: 1,
          description: "Tomorrow",
        })
      ).ok
    ).toBe(false)
    expect(
      (
        await engine.logTime(client.id, {
          date: "2026-11-26",
          hours: 25,
          description: "Too long",
        })
      ).ok
    ).toBe(false)
  })

  it("bills hours without a plan at the default rate", async () => {
    const { billing, engine } = setup()
    const client = expectOk(
      await billing.createClient({ name: "Bo", email: "bo@example.com" })
    )
    expectOk(
      await engine.saveSettings({
        paymentInstructions: "",
        defaultTaxRateBps: 0,
        reminderOffsets: [0],
        autoBillEnabled: true,
        defaultHourlyRate: { amount: 12_500, currency: "USD" },
      })
    )
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-11-26",
        hours: 0.5,
        description: "DNS change",
      })
    )
    expect(logged.entry).toMatchObject({ billedHours: 0.5, unitAmount: 12_500 })
  })
})

describe("billing and correcting logged time", () => {
  it("invoices billed hours as an hour line", async () => {
    const { engine, client, development } = await withPlan()
    await engine.logTime(client.id, {
      date: "2026-11-26",
      hours: 4.5,
      description: "Checkout work",
      catalogItemId: development.id,
    })
    const hourCharge = (await engine.pendingCharges(client.id)).find(
      (charge) => charge.unit === "hour"
    )
    if (!hourCharge) throw new Error("No hour charge")

    const [issued] = expectOk(
      await engine.invoiceCharges(client.id, [hourCharge.id], ADMIN)
    )
    expect(issued?.invoice.lineItems).toEqual([
      expect.objectContaining({
        quantity: 1.5,
        unitAmount: 15_000,
        unit: "hour",
      }),
    ])
  })

  it("lets a pending hour charge be edited to fractional hours", async () => {
    const { engine, client, development } = await withPlan()
    await engine.logTime(client.id, {
      date: "2026-11-26",
      hours: 4,
      description: "Checkout work",
      catalogItemId: development.id,
      billSeparately: true,
    })
    const [charge] = (await engine.pendingCharges(client.id)).filter(
      (candidate) => candidate.unit === "hour"
    )
    if (!charge) throw new Error("No hour charge")
    const updated = expectOk(
      await engine.updateCharge(charge.id, {
        description: charge.description,
        unitAmount: charge.unitAmount,
        quantity: 3.75,
      })
    )
    expect(updated.quantity).toBe(3.75)
  })

  it("removes an entry, its pending charge, and gives the hours back", async () => {
    const { engine, client, development } = await withPlan()
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-11-26",
        hours: 4,
        description: "Checkout work",
        catalogItemId: development.id,
      })
    )

    expectOk(await engine.removeTimeEntry(logged.entry.id))

    const pendingHours = (await engine.pendingCharges(client.id)).filter(
      (charge) => charge.unit === "hour"
    )
    expect(pendingHours).toEqual([])
    const overview = await engine.hoursOverview(client.id)
    expect(overview.allowances[0]).toMatchObject({ used: 0, remaining: 3 })
  })

  it("won't remove time that's already invoiced", async () => {
    const { engine, client, development } = await withPlan()
    const logged = expectOk(
      await engine.logTime(client.id, {
        date: "2026-11-26",
        hours: 4,
        description: "Checkout work",
        catalogItemId: development.id,
      })
    )
    await engine.invoiceCharges(client.id, "all", ADMIN)

    expect(await engine.removeTimeEntry(logged.entry.id)).toEqual({
      ok: false,
      error:
        "These hours are already on an invoice. Adjust that invoice instead.",
    })
  })
})
