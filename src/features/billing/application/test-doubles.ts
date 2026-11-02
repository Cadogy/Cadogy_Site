import type { Invoice } from "../domain/invoice"
import type {
  BillingClient,
  BillingNotification,
  BillingNotifier,
  BillingRepository,
} from "./ports"

export const createInMemoryBillingRepository = (): BillingRepository => {
  const clients = new Map<string, BillingClient>()
  const invoices = new Map<string, Invoice>()
  const counters = new Map<string, number>()
  let nextId = 0
  const id = (prefix: string) => `${prefix}_${++nextId}`

  return {
    insertClient: async (client) => {
      const stored = { ...client, id: id("client") }
      clients.set(stored.id, stored)
      return stored
    },
    saveClient: async (client) => {
      clients.set(client.id, client)
      return client
    },
    findClient: async (clientId) => clients.get(clientId) ?? null,
    listClients: async ({ includeArchived }) =>
      [...clients.values()].filter(
        (client) => includeArchived || !client.archivedAt
      ),
    findClientsByEmail: async (email) =>
      [...clients.values()].filter(
        (client) =>
          client.email === email ||
          client.contacts.some((contact) => contact.email === email)
      ),
    insertInvoice: async (invoice) => {
      const stored = { ...invoice, id: id("inv") }
      invoices.set(stored.id, stored)
      return stored
    },
    saveInvoice: async (invoice) => {
      invoices.set(invoice.id, invoice)
      return invoice
    },
    deleteInvoice: async (invoiceId) => {
      invoices.delete(invoiceId)
    },
    findInvoice: async (invoiceId) => invoices.get(invoiceId) ?? null,
    findInvoiceByToken: async (token) =>
      [...invoices.values()].find((invoice) => invoice.publicToken === token) ??
      null,
    listInvoices: async ({ status, clientIds }) =>
      [...invoices.values()].filter(
        (invoice) =>
          (!status || invoice.status === status) &&
          (!clientIds || clientIds.includes(invoice.clientId))
      ),
    findInvoiceByPaymentIntent: async (paymentIntentId) =>
      [...invoices.values()].find((invoice) =>
        invoice.payments.some(
          (payment) => payment.stripePaymentIntentId === paymentIntentId
        )
      ) ?? null,
    nextSequence: async (key) => {
      const value = (counters.get(key) ?? 0) + 1
      counters.set(key, value)
      return value
    },
  }
}

export const createRecordingNotifier = (): BillingNotifier & {
  readonly sent: BillingNotification[]
} => {
  const sent: BillingNotification[] = []
  return {
    sent,
    send: async (notification) => {
      sent.push(notification)
    },
  }
}
