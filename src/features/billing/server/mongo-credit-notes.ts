import "server-only"

import { model, models, Schema, type Model, type Types } from "mongoose"

import { connectToDatabase } from "@/lib/mongodb"

import type { CreditNote, CreditNoteRepository } from "../application/credits"
import { CURRENCIES } from "../domain/schema"

type CreditNoteDoc = Omit<CreditNote, "id"> & { _id: Types.ObjectId }

const creditNoteSchema = new Schema<CreditNoteDoc>(
  {
    number: { type: String, required: true, unique: true },
    clientId: { type: String, required: true, index: true },
    invoiceId: { type: String, default: null, index: true },
    kind: {
      type: String,
      enum: ["refund", "invoice_credit", "balance_credit"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, enum: CURRENCIES, required: true },
    reason: { type: String, default: "" },
    stripeRefundId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    createdAt: { type: Date, required: true },
    createdBy: { type: String, required: true },
  },
  { versionKey: false }
)

creditNoteSchema.index(
  { stripeRefundId: 1 },
  {
    unique: true,
    partialFilterExpression: { stripeRefundId: { $type: "string" } },
  }
)

const CreditNoteModel: Model<CreditNoteDoc> =
  models.CreditNote ??
  model<CreditNoteDoc>("CreditNote", creditNoteSchema, "billing_credit_notes")

const toNote = ({ _id, ...rest }: CreditNoteDoc): CreditNote => ({
  ...rest,
  id: _id.toString(),
})

const withDb =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args) => {
    await connectToDatabase()
    return fn(...args)
  }

export const mongoCreditNoteRepository: CreditNoteRepository = {
  insert: withDb(async (note) =>
    toNote((await CreditNoteModel.create(note)).toObject())
  ),
  list: withDb(async ({ clientId, invoiceId }) =>
    (
      await CreditNoteModel.find({
        ...(clientId ? { clientId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      })
        .sort({ createdAt: -1 })
        .lean<CreditNoteDoc[]>()
    ).map(toNote)
  ),
  findByStripeRefundId: withDb(async (refundId) => {
    const doc = await CreditNoteModel.findOne({
      stripeRefundId: refundId,
    }).lean<CreditNoteDoc>()
    return doc ? toNote(doc) : null
  }),
}
