import "server-only"

import { model, models, Schema, type Model, type Types } from "mongoose"

import { withDatabase, withId } from "@/lib/mongodb"

import type { CreditNote, CreditNoteRepository } from "../application/credits"
import { CREDIT_NOTE_KINDS } from "../domain/invoice"
import { CURRENCIES } from "../domain/schema"

type CreditNoteDoc = Omit<CreditNote, "id"> & { _id: Types.ObjectId }

const creditNoteSchema = new Schema<CreditNoteDoc>(
  {
    number: { type: String, required: true, unique: true },
    clientId: { type: String, required: true, index: true },
    invoiceId: { type: String, default: null, index: true },
    kind: {
      type: String,
      enum: CREDIT_NOTE_KINDS,
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

const toNote = (doc: CreditNoteDoc): CreditNote => withId(doc)

export const mongoCreditNoteRepository: CreditNoteRepository = {
  insert: withDatabase(async (note) =>
    toNote((await CreditNoteModel.create(note)).toObject())
  ),
  list: withDatabase(async ({ clientId, invoiceId }) =>
    (
      await CreditNoteModel.find({
        ...(clientId ? { clientId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      })
        .sort({ createdAt: -1 })
        .lean<CreditNoteDoc[]>()
    ).map(toNote)
  ),
  findByStripeRefundId: withDatabase(async (refundId) => {
    const doc = await CreditNoteModel.findOne({
      stripeRefundId: refundId,
    }).lean<CreditNoteDoc>()
    return doc ? toNote(doc) : null
  }),
}
