import "server-only"

import { isValidObjectId, Types } from "mongoose"

import { connectToDatabase } from "@/lib/mongodb"

import type { BillingClient, BillingRepository } from "../application/ports"
import type { Invoice } from "../domain/invoice"
import {
  BillingClientModel,
  CounterModel,
  InvoiceModel,
  type BillingClientDoc,
  type InvoiceDoc,
} from "./models"

const toClient = ({ _id, ...rest }: BillingClientDoc): BillingClient => ({
  name: rest.name,
  company: rest.company,
  email: rest.email,
  address: rest.address,
  taxId: rest.taxId,
  currency: rest.currency,
  defaultTermsDays: rest.defaultTermsDays,
  notes: rest.notes,
  contacts: (rest.contacts ?? []).map((contact) => ({
    email: contact.email,
    name: contact.name ?? "",
    role: contact.role,
    addedAt: contact.addedAt,
    addedBy: contact.addedBy ?? null,
  })),
  archivedAt: rest.archivedAt ?? null,
  autoBill: rest.autoBill ?? true,
  autopay: {
    enabled: rest.autopay?.enabled ?? false,
    card: rest.autopay?.card
      ? {
          stripeCustomerId: rest.autopay.card.stripeCustomerId,
          paymentMethodId: rest.autopay.card.paymentMethodId,
          brand: rest.autopay.card.brand,
          last4: rest.autopay.card.last4,
          expMonth: rest.autopay.card.expMonth,
          expYear: rest.autopay.card.expYear,
        }
      : null,
  },
  id: _id.toString(),
})

const toInvoice = (doc: InvoiceDoc): Invoice => ({
  id: doc._id.toString(),
  number: doc.number ?? null,
  clientId: doc.clientId.toString(),
  clientSnapshot: doc.clientSnapshot ?? null,
  status: doc.status,
  currency: doc.currency,
  issueDate: doc.issueDate ?? null,
  dueDate: doc.dueDate ?? null,
  termsDays: doc.termsDays,
  lineItems: doc.lineItems.map(({ description, quantity, unitAmount }) => ({
    description,
    quantity,
    unitAmount,
  })),
  discount: doc.discount
    ? { type: doc.discount.type, value: doc.discount.value }
    : null,
  taxRateBps: doc.taxRateBps,
  memo: doc.memo,
  footer: doc.footer,
  internalNotes: doc.internalNotes,
  payments: doc.payments.map((payment) => ({
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference ?? "",
    paidAt: payment.paidAt,
    ...(payment.stripeEventId ? { stripeEventId: payment.stripeEventId } : {}),
  })),
  events: doc.events.map((event) => ({
    type: event.type,
    at: event.at,
    ...(event.actorId ? { actorId: event.actorId } : {}),
    ...(event.detail ? { detail: event.detail } : {}),
  })),
  publicToken: doc.publicToken,
})

const toInvoiceFields = ({
  id: _id,
  clientId,
  ...rest
}: Invoice | (Omit<Invoice, "id"> & { id?: string })) => ({
  ...rest,
  clientId: new Types.ObjectId(clientId),
})

const toClientFields = (client: BillingClient | Omit<BillingClient, "id">) => {
  const { id: _id, ...rest } = { id: undefined, ...client }
  return rest
}

const withDatabase =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args): Promise<R> => {
    await connectToDatabase()
    return fn(...args)
  }

export const mongoBillingRepository: BillingRepository = {
  insertClient: withDatabase(async (client) => {
    const created = await BillingClientModel.create(toClientFields(client))
    return toClient(created.toObject())
  }),
  saveClient: withDatabase(async (client) => {
    await BillingClientModel.replaceOne(
      { _id: client.id },
      toClientFields(client)
    )
    return client
  }),
  findClient: withDatabase(async (id) => {
    if (!isValidObjectId(id)) return null
    const doc = await BillingClientModel.findById(id).lean<BillingClientDoc>()
    return doc ? toClient(doc) : null
  }),
  listClients: withDatabase(async ({ includeArchived }) => {
    const filter = includeArchived ? {} : { archivedAt: null }
    const docs = await BillingClientModel.find(filter)
      .sort({ name: 1 })
      .lean<BillingClientDoc[]>()
    return docs.map(toClient)
  }),
  findClientsByEmail: withDatabase(async (email) => {
    const docs = await BillingClientModel.find({
      $or: [{ email }, { "contacts.email": email }],
    }).lean<BillingClientDoc[]>()
    return docs.map(toClient)
  }),
  insertInvoice: withDatabase(async (invoice) => {
    const created = await InvoiceModel.create(toInvoiceFields(invoice))
    return toInvoice(created.toObject())
  }),
  saveInvoice: withDatabase(async (invoice) => {
    await InvoiceModel.replaceOne({ _id: invoice.id }, toInvoiceFields(invoice))
    return invoice
  }),
  deleteInvoice: withDatabase(async (id) => {
    await InvoiceModel.deleteOne({ _id: id, status: "draft" })
  }),
  findInvoice: withDatabase(async (id) => {
    if (!isValidObjectId(id)) return null
    const doc = await InvoiceModel.findById(id).lean<InvoiceDoc>()
    return doc ? toInvoice(doc) : null
  }),
  findInvoiceByToken: withDatabase(async (token) => {
    const doc = await InvoiceModel.findOne({
      publicToken: token,
    }).lean<InvoiceDoc>()
    return doc ? toInvoice(doc) : null
  }),
  listInvoices: withDatabase(async ({ status, clientIds }) => {
    const docs = await InvoiceModel.find({
      ...(status ? { status } : {}),
      ...(clientIds
        ? {
            clientId: {
              $in: clientIds
                .filter(isValidObjectId)
                .map((id) => new Types.ObjectId(id)),
            },
          }
        : {}),
    })
      .sort({ createdAt: -1 })
      .lean<InvoiceDoc[]>()
    return docs.map(toInvoice)
  }),
  nextSequence: withDatabase(async (key) => {
    const counter = await CounterModel.findOneAndUpdate(
      { _id: key },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true }
    ).lean()
    if (!counter) throw new Error(`Failed to allocate sequence for ${key}`)
    return counter.sequence
  }),
}
