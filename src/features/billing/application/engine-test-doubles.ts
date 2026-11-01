import {
  DEFAULT_SETTINGS,
  type BillingSettings,
  type CatalogItem,
  type Charge,
  type ChargeResult,
  type EngineRepository,
  type PaymentGateway,
  type RunSummary,
  type StoredAddOn,
} from "./engine-ports"

export const createInMemoryEngineRepository = (): EngineRepository => {
  const catalog = new Map<string, CatalogItem>()
  const addOns = new Map<string, StoredAddOn>()
  const charges = new Map<string, Charge>()
  const runs: RunSummary[] = []
  let settings: BillingSettings = DEFAULT_SETTINGS
  let counter = 0
  const id = (prefix: string) => `${prefix}_${++counter}`

  return {
    catalog: {
      list: async ({ includeArchived }) =>
        [...catalog.values()].filter(
          (item) => includeArchived || !item.archived
        ),
      find: async (itemId) => catalog.get(itemId) ?? null,
      insert: async (item) => {
        const stored = { ...item, id: id("cat") }
        catalog.set(stored.id, stored)
        return stored
      },
      save: async (item) => {
        catalog.set(item.id, item)
        return item
      },
    },
    addOns: {
      insert: async (addOn) => {
        const stored = { ...addOn, id: id("addon") }
        addOns.set(stored.id, stored)
        return stored
      },
      save: async (addOn) => {
        addOns.set(addOn.id, addOn)
        return addOn
      },
      find: async (addOnId) => addOns.get(addOnId) ?? null,
      list: async ({ clientIds, dueBy }) =>
        [...addOns.values()].filter(
          (addOn) =>
            (!clientIds || clientIds.includes(addOn.clientId)) &&
            (!dueBy || addOn.nextBillingDate.getTime() <= dueBy.getTime())
        ),
    },
    charges: {
      insertIfNew: async (charge) => {
        const duplicate = [...charges.values()].some(
          (existing) =>
            charge.addOnId !== null &&
            existing.addOnId === charge.addOnId &&
            existing.periodStart?.getTime() === charge.periodStart?.getTime()
        )
        if (duplicate) return null
        const stored = { ...charge, id: id("ch") }
        charges.set(stored.id, stored)
        return stored
      },
      save: async (charge) => {
        charges.set(charge.id, charge)
        return charge
      },
      list: async ({ clientId, status, ids }) =>
        [...charges.values()].filter(
          (charge) =>
            (!clientId || charge.clientId === clientId) &&
            (!status || charge.status === status) &&
            (!ids || ids.includes(charge.id))
        ),
    },
    settings: {
      get: async () => settings,
      save: async (next) => {
        settings = next
        return settings
      },
    },
    runs: {
      record: async (summary) => {
        runs.push(summary)
      },
      latest: async () => runs.at(-1) ?? null,
    },
  }
}

export const createFakeGateway = (
  outcome: (amount: number) => ChargeResult
) => {
  const attempts: { amount: number; invoiceId: string }[] = []
  const gateway: PaymentGateway = {
    chargeSavedCard: async (request) => {
      attempts.push({ amount: request.amount, invoiceId: request.invoiceId })
      return outcome(request.amount)
    },
  }
  return { gateway, attempts }
}
