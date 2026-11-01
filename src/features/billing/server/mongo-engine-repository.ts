import "server-only"

import { isValidObjectId } from "mongoose"

import { connectToDatabase } from "@/lib/mongodb"

import {
  DEFAULT_SETTINGS,
  type CatalogItem,
  type Charge,
  type EngineRepository,
  type RunSummary,
  type StoredAddOn,
} from "../application/engine-ports"
import {
  AddOnModel,
  BillingRunModel,
  BillingSettingsModel,
  CatalogItemModel,
  ChargeModel,
  type AddOnDoc,
  type BillingRunDoc,
  type BillingSettingsDoc,
  type CatalogItemDoc,
  type ChargeDoc,
} from "./models"

const SETTINGS_ID = "default"
const DUPLICATE_KEY = 11000

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === DUPLICATE_KEY

const withDatabase =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args): Promise<R> => {
    await connectToDatabase()
    return fn(...args)
  }

const withoutId = <T extends { id: string }>({ id: _id, ...rest }: T) => rest

const toCatalogItem = (doc: CatalogItemDoc): CatalogItem => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description,
  unitAmount: doc.unitAmount,
  currency: doc.currency,
  interval: doc.interval,
  archived: doc.archived ?? false,
})

const toAddOn = (doc: AddOnDoc): StoredAddOn => ({
  id: doc._id.toString(),
  clientId: doc.clientId,
  catalogItemId: doc.catalogItemId ?? null,
  name: doc.name,
  unitAmount: doc.unitAmount,
  quantity: doc.quantity,
  currency: doc.currency,
  interval: doc.interval,
  anchorDay: doc.anchorDay,
  startDate: doc.startDate,
  nextBillingDate: doc.nextBillingDate,
  status: doc.status,
  canceledAt: doc.canceledAt ?? null,
})

const toCharge = (doc: ChargeDoc): Charge => ({
  id: doc._id.toString(),
  clientId: doc.clientId,
  addOnId: doc.addOnId ?? null,
  description: doc.description,
  quantity: doc.quantity,
  unitAmount: doc.unitAmount,
  currency: doc.currency,
  periodStart: doc.periodStart ?? null,
  periodEnd: doc.periodEnd ?? null,
  status: doc.status,
  invoiceId: doc.invoiceId ?? null,
  createdAt: doc.createdAt,
})

const toSettings = (doc: BillingSettingsDoc | null) =>
  doc
    ? {
        paymentInstructions: doc.paymentInstructions,
        defaultTaxRateBps: doc.defaultTaxRateBps,
        reminderOffsets: [...doc.reminderOffsets],
        autoBillEnabled: doc.autoBillEnabled,
      }
    : DEFAULT_SETTINGS

const toRun = ({ _id, failures, ...run }: BillingRunDoc): RunSummary => ({
  ...run,
  errors: [...(failures ?? [])],
})

export const mongoEngineRepository: EngineRepository = {
  catalog: {
    list: withDatabase(async ({ includeArchived }) => {
      const docs = await CatalogItemModel.find(
        includeArchived ? {} : { archived: false }
      )
        .sort({ name: 1 })
        .lean<CatalogItemDoc[]>()
      return docs.map(toCatalogItem)
    }),
    find: withDatabase(async (id) => {
      if (!isValidObjectId(id)) return null
      const doc = await CatalogItemModel.findById(id).lean<CatalogItemDoc>()
      return doc ? toCatalogItem(doc) : null
    }),
    insert: withDatabase(async (item) =>
      toCatalogItem((await CatalogItemModel.create(item)).toObject())
    ),
    save: withDatabase(async (item) => {
      await CatalogItemModel.replaceOne({ _id: item.id }, withoutId(item))
      return item
    }),
  },
  addOns: {
    insert: withDatabase(async (addOn) =>
      toAddOn((await AddOnModel.create(addOn)).toObject())
    ),
    save: withDatabase(async (addOn) => {
      await AddOnModel.replaceOne({ _id: addOn.id }, withoutId(addOn))
      return addOn
    }),
    find: withDatabase(async (id) => {
      if (!isValidObjectId(id)) return null
      const doc = await AddOnModel.findById(id).lean<AddOnDoc>()
      return doc ? toAddOn(doc) : null
    }),
    list: withDatabase(async ({ clientIds, dueBy }) => {
      const docs = await AddOnModel.find({
        ...(clientIds ? { clientId: { $in: clientIds } } : {}),
        ...(dueBy ? { nextBillingDate: { $lte: dueBy } } : {}),
      })
        .sort({ nextBillingDate: 1 })
        .lean<AddOnDoc[]>()
      return docs.map(toAddOn)
    }),
  },
  charges: {
    insertIfNew: withDatabase(async (charge) => {
      try {
        return toCharge((await ChargeModel.create(charge)).toObject())
      } catch (error) {
        if (isDuplicateKeyError(error)) return null
        throw error
      }
    }),
    save: withDatabase(async (charge) => {
      await ChargeModel.replaceOne({ _id: charge.id }, withoutId(charge))
      return charge
    }),
    list: withDatabase(async ({ clientId, status, ids }) => {
      const docs = await ChargeModel.find({
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
        ...(ids ? { _id: { $in: ids.filter(isValidObjectId) } } : {}),
      })
        .sort({ createdAt: 1 })
        .lean<ChargeDoc[]>()
      return docs.map(toCharge)
    }),
  },
  settings: {
    get: withDatabase(async () =>
      toSettings(
        await BillingSettingsModel.findById(
          SETTINGS_ID
        ).lean<BillingSettingsDoc>()
      )
    ),
    save: withDatabase(async (settings) => {
      await BillingSettingsModel.updateOne(
        { _id: SETTINGS_ID },
        { $set: settings },
        { upsert: true }
      )
      return settings
    }),
  },
  runs: {
    record: withDatabase(async (summary) => {
      const { errors, ...counts } = summary
      await BillingRunModel.create({ ...counts, failures: [...errors] })
    }),
    latest: withDatabase(async () => {
      const doc = await BillingRunModel.findOne()
        .sort({ at: -1 })
        .lean<BillingRunDoc>()
      return doc ? toRun(doc) : null
    }),
  },
}
