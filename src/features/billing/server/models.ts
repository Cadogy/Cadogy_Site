import "server-only"

import { model, models, Schema, type Model, type Types } from "mongoose"

import type {
  BillingSettings,
  CatalogItem,
  Charge,
  RunSummary,
  StoredAddOn,
} from "../application/engine-ports"
import type { BillingClient } from "../application/ports"
import { CONTACT_ROLES } from "../domain/contacts"
import { INVOICE_EVENT_TYPES, type Invoice } from "../domain/invoice"
import { ADD_ON_STATUSES, BILLING_INTERVALS } from "../domain/recurring"
import { CURRENCIES, INVOICE_STATUSES, PAYMENT_METHODS } from "../domain/schema"

export type BillingClientDoc = Omit<BillingClient, "id"> & {
  _id: Types.ObjectId
}
export type InvoiceDoc = Omit<Invoice, "id" | "clientId"> & {
  _id: Types.ObjectId
  clientId: Types.ObjectId
}
export type CatalogItemDoc = Omit<CatalogItem, "id"> & { _id: Types.ObjectId }
export type AddOnDoc = Omit<StoredAddOn, "id"> & { _id: Types.ObjectId }
export type ChargeDoc = Omit<Charge, "id"> & { _id: Types.ObjectId }
export type BillingSettingsDoc = BillingSettings & { _id: string }
export type BillingRunDoc = Omit<RunSummary, "errors"> & {
  _id: Types.ObjectId
  failures: string[]
}
type CounterDoc = { _id: string; sequence: number }
type ProcessedStripeEventDoc = { _id: string }

const addressSchema = new Schema(
  {
    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    region: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { _id: false }
)

const billingClientSchema = new Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, index: true },
    address: { type: addressSchema, default: () => ({}) },
    taxId: { type: String, default: "" },
    currency: { type: String, enum: CURRENCIES, default: "USD" },
    defaultTermsDays: { type: Number, default: 15 },
    notes: { type: String, default: "" },
    contacts: {
      type: [
        new Schema(
          {
            email: { type: String, required: true, lowercase: true },
            name: { type: String, default: "" },
            role: { type: String, enum: CONTACT_ROLES, required: true },
            addedAt: { type: Date, required: true },
            addedBy: { type: String, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    archivedAt: { type: Date, default: null },
    autoBill: { type: Boolean, default: true },
    autopay: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          card: {
            type: new Schema(
              {
                stripeCustomerId: String,
                paymentMethodId: String,
                brand: String,
                last4: String,
                expMonth: Number,
                expYear: Number,
              },
              { _id: false }
            ),
            default: null,
          },
        },
        { _id: false }
      ),
      default: () => ({ enabled: false, card: null }),
    },
  },
  { timestamps: true }
)

billingClientSchema.index({ "contacts.email": 1 })

const invoiceSchema = new Schema(
  {
    number: { type: String, default: null },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "BillingClient",
      required: true,
      index: true,
    },
    clientSnapshot: {
      type: new Schema(
        {
          name: String,
          company: String,
          email: String,
          address: addressSchema,
          taxId: String,
        },
        { _id: false }
      ),
      default: null,
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      required: true,
      index: true,
    },
    currency: { type: String, enum: CURRENCIES, required: true },
    issueDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    termsDays: { type: Number, required: true },
    lineItems: [
      new Schema(
        { description: String, quantity: Number, unitAmount: Number },
        { _id: false }
      ),
    ],
    discount: {
      type: new Schema(
        { type: { type: String, enum: ["percent", "amount"] }, value: Number },
        { _id: false }
      ),
      default: null,
    },
    taxRateBps: { type: Number, default: 0 },
    memo: { type: String, default: "" },
    footer: { type: String, default: "" },
    internalNotes: { type: String, default: "" },
    payments: [
      new Schema(
        {
          amount: Number,
          method: { type: String, enum: PAYMENT_METHODS },
          reference: String,
          paidAt: Date,
          stripeEventId: String,
          stripePaymentIntentId: String,
        },
        { _id: false }
      ),
    ],
    adjustments: [
      new Schema(
        {
          creditNoteId: String,
          number: String,
          kind: { type: String, enum: ["refund", "invoice_credit"] },
          amount: Number,
        },
        { _id: false }
      ),
    ],
    events: [
      new Schema(
        {
          type: { type: String, enum: INVOICE_EVENT_TYPES },
          at: Date,
          actorId: String,
          detail: String,
        },
        { _id: false }
      ),
    ],
    publicToken: { type: String, required: true, unique: true },
  },
  { timestamps: true }
)

invoiceSchema.index(
  { number: 1 },
  { unique: true, partialFilterExpression: { number: { $type: "string" } } }
)

const counterSchema = new Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, required: true },
})

const processedStripeEventSchema = new Schema(
  { _id: { type: String, required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const BillingClientModel: Model<BillingClientDoc> =
  models.BillingClient ??
  model<BillingClientDoc>("BillingClient", billingClientSchema)
export const InvoiceModel: Model<InvoiceDoc> =
  models.Invoice ?? model<InvoiceDoc>("Invoice", invoiceSchema)
export const CounterModel: Model<CounterDoc> =
  models.Counter ?? model<CounterDoc>("Counter", counterSchema)
export const ProcessedStripeEventModel: Model<ProcessedStripeEventDoc> =
  models.ProcessedStripeEvent ??
  model<ProcessedStripeEventDoc>(
    "ProcessedStripeEvent",
    processedStripeEventSchema,
    "processed_stripe_events"
  )

const catalogItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    unitAmount: { type: Number, required: true },
    currency: { type: String, enum: CURRENCIES, required: true },
    interval: { type: String, enum: BILLING_INTERVALS, required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const addOnSchema = new Schema(
  {
    clientId: { type: String, required: true, index: true },
    catalogItemId: { type: String, default: null },
    name: { type: String, required: true },
    unitAmount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    currency: { type: String, enum: CURRENCIES, required: true },
    interval: { type: String, enum: BILLING_INTERVALS, required: true },
    anchorDay: { type: Number, required: true },
    startDate: { type: Date, required: true },
    nextBillingDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ADD_ON_STATUSES, required: true },
    canceledAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const chargeSchema = new Schema(
  {
    clientId: { type: String, required: true, index: true },
    addOnId: { type: String, default: null },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitAmount: { type: Number, required: true },
    currency: { type: String, enum: CURRENCIES, required: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "invoiced", "void"],
      required: true,
      index: true,
    },
    invoiceId: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
)

chargeSchema.index(
  { addOnId: 1, periodStart: 1 },
  { unique: true, partialFilterExpression: { addOnId: { $type: "string" } } }
)

const billingSettingsSchema = new Schema({
  _id: { type: String, required: true },
  paymentInstructions: { type: String, default: "" },
  defaultTaxRateBps: { type: Number, default: 0 },
  reminderOffsets: { type: [Number], default: [-3, 0, 7, 14] },
  autoBillEnabled: { type: Boolean, default: true },
})

const billingRunSchema = new Schema({
  at: { type: Date, required: true, index: true },
  chargesCreated: Number,
  invoicesIssued: Number,
  autopayCollected: Number,
  autopayFailed: Number,
  remindersSent: Number,
  failures: { type: [String], default: [] },
})

export const CatalogItemModel: Model<CatalogItemDoc> =
  models.CatalogItem ??
  model<CatalogItemDoc>("CatalogItem", catalogItemSchema, "billing_catalog")
export const AddOnModel: Model<AddOnDoc> =
  models.AddOn ?? model<AddOnDoc>("AddOn", addOnSchema, "billing_add_ons")
export const ChargeModel: Model<ChargeDoc> =
  models.Charge ?? model<ChargeDoc>("Charge", chargeSchema, "billing_charges")
export const BillingSettingsModel: Model<BillingSettingsDoc> =
  models.BillingSettings ??
  model<BillingSettingsDoc>(
    "BillingSettings",
    billingSettingsSchema,
    "billing_settings"
  )
export const BillingRunModel: Model<BillingRunDoc> =
  models.BillingRun ??
  model<BillingRunDoc>("BillingRun", billingRunSchema, "billing_runs")
