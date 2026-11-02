import type { ClientSnapshot, Invoice } from "./invoice"
import type { InvoiceAmounts, LineItem, Payment } from "./schema"

export const buildLineItem = (overrides: Partial<LineItem> = {}): LineItem => ({
  description: "Engineering services",
  quantity: 1,
  unitAmount: 10_000,
  ...overrides,
})

export const buildInvoiceDraft = (
  overrides: Partial<InvoiceAmounts> = {}
): InvoiceAmounts => ({
  lineItems: [buildLineItem()],
  discount: null,
  taxRateBps: 0,
  payments: [],
  ...overrides,
})

export const buildClientSnapshot = (
  overrides: Partial<ClientSnapshot> = {}
): ClientSnapshot => ({
  name: "Ada Lovelace",
  company: "Analytical Engines Inc.",
  email: "billing@analytical.example",
  address: {
    line1: "1 Engine Way",
    line2: "",
    city: "London",
    region: "",
    postalCode: "N1",
    country: "United Kingdom",
  },
  taxId: "",
  ...overrides,
})

export const buildPayment = (overrides: Partial<Payment> = {}): Payment => ({
  amount: 10_000,
  method: "bank_transfer",
  reference: "",
  paidAt: new Date("2026-11-05T00:00:00.000Z"),
  ...overrides,
})

export const buildInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv_1",
  number: null,
  clientId: "client_1",
  clientSnapshot: null,
  status: "draft",
  currency: "USD",
  issueDate: null,
  dueDate: null,
  termsDays: 15,
  lineItems: [buildLineItem()],
  discount: null,
  taxRateBps: 0,
  memo: "",
  footer: "",
  internalNotes: "",
  payments: [],
  adjustments: [],
  events: [],
  publicToken: "token",
  ...overrides,
})
