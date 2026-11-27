import { describe, expect, it } from "vitest"

import {
  draftFromInvoice,
  editorToDraft,
  lineFromCatalog,
  type CatalogOption,
} from "../components/editor-model"
import { catalogPriceLabel } from "../domain/catalog"
import { calculateInvoiceTotals } from "../domain/totals"
import { createBillingService } from "./billing-service"
import { createBillingEngine, NO_HOURLY_RATE } from "./engine"
import type { BillingSettings } from "./engine-ports"
import {
  createFakeGateway,
  createInMemoryEngineRepository,
} from "./engine-test-doubles"
import {
  createInMemoryBillingRepository,
  createRecordingNotifier,
} from "./test-doubles"

const ADMIN = "admin_1"

const setup = () => {
  const notifier = createRecordingNotifier()
  let token = 0
  const billing = createBillingService({
    repository: createInMemoryBillingRepository(),
    notifier,
    clock: () => new Date("2026-11-26T09:00:00.000Z"),
    generateToken: () => `tok_${++token}`,
  })
  const engine = createBillingEngine({
    billing,
    repository: createInMemoryEngineRepository(),
    gateway: createFakeGateway(() => ({ ok: true, paymentId: "pi_1" })).gateway,
    clock: () => new Date("2026-11-26T09:00:00.000Z"),
  })
  return { billing, engine, notifier }
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(result.error)
  return result.value
}

const settings = (
  overrides: Partial<BillingSettings> = {}
): BillingSettings => ({
  paymentInstructions: "",
  defaultTaxRateBps: 0,
  reminderOffsets: [0],
  autoBillEnabled: true,
  defaultHourlyRate: null,
  ...overrides,
})

const usd = (amount: number) => ({ amount, currency: "USD" as const })
const HOURLY = { pricing: "hourly", interval: "one_time" } as const

describe("service categories and hourly pricing", () => {
  it("requires a price for fixed services but not for hourly ones", async () => {
    const { engine } = setup()
    expect(
      await engine.createCatalogItem({ name: "Setup", interval: "one_time" })
    ).toEqual({ ok: false, error: "Enter a price for fixed-price services" })
    expectOk(await engine.createCatalogItem({ ...HOURLY, name: "Consulting" }))
  })

  it("keeps existing fixed-price services working without the new fields", async () => {
    const { engine } = setup()
    const item = expectOk(
      await engine.createCatalogItem({
        name: "Business email",
        unitAmount: 800,
        interval: "month",
      })
    )
    expect(item).toMatchObject({
      pricing: "fixed",
      categoryId: null,
      unitAmount: 800,
    })
  })

  it("rejects services filed under a category that doesn't exist", async () => {
    const { engine } = setup()
    expect(
      await engine.createCatalogItem({
        ...HOURLY,
        name: "Consulting",
        categoryId: "missing",
      })
    ).toEqual({ ok: false, error: "Category not found" })
  })

  it("prices hourly services from the service, then category, then global default", async () => {
    const { engine } = setup()
    expectOk(
      await engine.saveSettings(settings({ defaultHourlyRate: usd(9_000) }))
    )
    const design = expectOk(
      await engine.createCategory({
        name: "Design",
        hourlyRate: usd(15_000),
      })
    )
    await engine.createCatalogItem({
      ...HOURLY,
      name: "Art direction",
      categoryId: design.id,
      unitAmount: 20_000,
    })
    await engine.createCatalogItem({
      ...HOURLY,
      name: "UI design",
      categoryId: design.id,
    })
    await engine.createCatalogItem({ ...HOURLY, name: "Support" })
    await engine.createCatalogItem({
      ...HOURLY,
      name: "Euro support",
      currency: "EUR",
    })

    const { items } = await engine.pricedCatalog({ includeArchived: false })
    const priceOf = (name: string) =>
      items.find((item) => item.name === name)?.price

    expect(priceOf("Art direction")).toEqual({
      unitAmount: 20_000,
      source: "service",
    })
    expect(priceOf("UI design")).toEqual({
      unitAmount: 15_000,
      source: "category",
    })
    expect(priceOf("Support")).toEqual({ unitAmount: 9_000, source: "default" })
    expect(priceOf("Euro support")).toBeNull()
  })

  it("updates a category's rate and every hourly service that inherits it", async () => {
    const { engine } = setup()
    const design = expectOk(
      await engine.createCategory({ name: "Design", hourlyRate: usd(15_000) })
    )
    await engine.createCatalogItem({
      ...HOURLY,
      name: "UI design",
      categoryId: design.id,
    })

    expectOk(
      await engine.updateCategory(design.id, {
        name: "Product design",
        hourlyRate: usd(17_500),
      })
    )

    const { items, categories } = await engine.pricedCatalog({
      includeArchived: false,
    })
    expect(categories).toEqual([
      { id: design.id, name: "Product design", hourlyRate: usd(17_500) },
    ])
    expect(items[0]?.price?.unitAmount).toBe(17_500)
  })

  it("keeps a category's services when the category is deleted", async () => {
    const { engine } = setup()
    const design = expectOk(await engine.createCategory({ name: "Design" }))
    const item = expectOk(
      await engine.createCatalogItem({
        name: "Logo",
        unitAmount: 50_000,
        interval: "one_time",
        categoryId: design.id,
      })
    )

    expectOk(await engine.deleteCategory(design.id))

    expect(await engine.listCategories()).toEqual([])
    expect(await engine.listCatalog({ includeArchived: true })).toEqual([
      expect.objectContaining({ id: item.id, categoryId: null }),
    ])
  })

  it("adds an hourly service to a client at the inherited rate", async () => {
    const { billing, engine } = setup()
    const client = expectOk(
      await billing.createClient({ name: "Ada", email: "ada@example.com" })
    )
    const ops = expectOk(
      await engine.createCategory({ name: "Ops", hourlyRate: usd(12_000) })
    )
    const item = expectOk(
      await engine.createCatalogItem({
        name: "On-call hours",
        pricing: "hourly",
        interval: "month",
        categoryId: ops.id,
      })
    )

    const addOn = expectOk(
      await engine.addAddOn(client.id, {
        catalogItemId: item.id,
        quantity: 10,
        startDate: "2026-12-01",
      })
    )

    expect(addOn).toMatchObject({ unitAmount: 12_000, quantity: 10 })
  })

  it("explains when an hourly service has no rate to bill", async () => {
    const { billing, engine } = setup()
    const client = expectOk(
      await billing.createClient({ name: "Ada", email: "ada@example.com" })
    )
    const item = expectOk(
      await engine.createCatalogItem({ ...HOURLY, name: "Consulting" })
    )
    expect(
      await engine.addAddOn(client.id, { catalogItemId: item.id })
    ).toEqual({ ok: false, error: NO_HOURLY_RATE })
  })
})

describe("units, starting prices and at-cost expenses", () => {
  it("stores a unit and a starting price, normalizing the unit", async () => {
    const { engine } = setup()
    const item = expectOk(
      await engine.createCatalogItem({
        name: "On-Page SEO Optimization",
        unitAmount: 10_000,
        interval: "one_time",
        unit: " Per Page ",
        priceFrom: true,
      })
    )

    expect(item).toMatchObject({ unit: "page", priceFrom: true })
  })

  it("keeps services without the new fields as whole, exact-price services", async () => {
    const { engine } = setup()
    const item = expectOk(
      await engine.createCatalogItem({
        name: "Logo Design",
        unitAmount: 50_000,
        interval: "one_time",
      })
    )

    expect(item).toMatchObject({ unit: null, priceFrom: false })
  })

  it("lets at-cost expenses go without a price, but asks for one when billed", async () => {
    const { billing, engine } = setup()
    const client = expectOk(
      await billing.createClient({ name: "Ada", email: "ada@example.com" })
    )
    const item = expectOk(
      await engine.createCatalogItem({
        name: "Cloud Infrastructure Costs",
        pricing: "at_cost",
        interval: "month",
      })
    )

    const missing = await engine.addAddOn(client.id, { catalogItemId: item.id })
    expect(missing).toEqual({
      ok: false,
      error:
        "Cloud Infrastructure Costs is billed at cost. Enter what it costs.",
    })
    const addOn = expectOk(
      await engine.addAddOn(client.id, {
        catalogItemId: item.id,
        unitAmount: 4_200,
      })
    )
    expect(addOn).toMatchObject({ unitAmount: 4_200, interval: "month" })
  })
})

describe("invoicing from the catalog, end to end", () => {
  it("turns catalog services into an issued invoice with hours and the right totals", async () => {
    const { billing, engine, notifier } = setup()
    const client = expectOk(
      await billing.createClient({ name: "Ada", email: "ada@example.com" })
    )
    expectOk(
      await engine.saveSettings(settings({ defaultHourlyRate: usd(10_000) }))
    )
    const dev = expectOk(
      await engine.createCategory({
        name: "Development",
        hourlyRate: usd(15_000),
      })
    )
    await engine.createCatalogItem({
      ...HOURLY,
      name: "Engineering",
      categoryId: dev.id,
    })
    await engine.createCatalogItem({
      name: "Hosting setup",
      unitAmount: 25_000,
      interval: "one_time",
    })

    // What the draft page hands the editor.
    const { items } = await engine.pricedCatalog({ includeArchived: false })
    const options: CatalogOption[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      categoryName: item.category?.name ?? null,
      currency: item.currency,
      hourly: item.pricing === "hourly",
      unitAmount: item.price?.unitAmount ?? null,
      priceLabel: catalogPriceLabel(item),
    }))
    const option = (name: string) => {
      const found = options.find((candidate) => candidate.name === name)
      if (!found) throw new Error(`No catalog option ${name}`)
      return found
    }

    // What the admin does in the editor: pick two services, log 2.5 hours.
    const draft = expectOk(
      await billing.createDraft({ clientId: client.id }, ADMIN)
    )
    const payload = expectOk(
      editorToDraft({
        ...draftFromInvoice(draft),
        lineItems: [
          { ...lineFromCatalog(option("Engineering"), "l1"), quantity: "2.5" },
          lineFromCatalog(option("Hosting setup"), "l2"),
        ],
      })
    )
    expectOk(await billing.updateDraftInvoice(draft.id, payload, ADMIN))
    const issued = expectOk(await billing.issue(draft.id, ADMIN))

    expect(issued.lineItems).toEqual([
      {
        description: "Engineering",
        quantity: 2.5,
        unitAmount: 15_000,
        unit: "hour",
      },
      { description: "Hosting setup", quantity: 1, unitAmount: 25_000 },
    ])
    expect(calculateInvoiceTotals(issued).total).toBe(62_500)
    expect(issued.status).toBe("open")
    expect(notifier.sent.at(-1)?.kind).toBe("issued")
    // Duplicating the invoice keeps the hourly unit on the copied line.
    const copy = expectOk(await billing.duplicate(issued.id, ADMIN))
    expect(draftFromInvoice(copy).lineItems[0]?.unit).toBe("hour")
  })
})
