import "server-only"

import Stripe from "stripe"

import { env } from "@/env"

import type { PaymentGateway } from "../application/engine-ports"
import type { BillingClient, SavedCard } from "../application/ports"
import type { Invoice } from "../domain/invoice"
import type { Currency } from "../domain/schema"
import { calculateInvoiceTotals } from "../domain/totals"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

export const isStripeConfigured = () => stripe !== null

export const createInvoiceCheckout = async (invoice: Invoice) => {
  if (!stripe) throw new Error("Stripe is not configured")
  const { amountDue } = calculateInvoiceTotals(invoice)
  const invoiceUrl = `${env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.publicToken}`

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.clientSnapshot?.email,
    client_reference_id: invoice.id,
    metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number ?? "" },
    payment_intent_data: {
      description: `Cadogy invoice ${invoice.number}`,
      metadata: { invoiceId: invoice.id },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: amountDue,
          product_data: { name: `Invoice ${invoice.number}` },
        },
      },
    ],
    success_url: `${invoiceUrl}?payment=success`,
    cancel_url: invoiceUrl,
  })

  if (!session.url) throw new Error("Stripe did not return a checkout URL")
  return session.url
}

const requireStripe = () => {
  if (!stripe) throw new Error("Stripe is not configured")
  return stripe
}

export const createBatchCheckout = async ({
  invoiceIds,
  amount,
  currency,
  email,
}: {
  invoiceIds: readonly string[]
  amount: number
  currency: Currency
  email: string
}) => {
  const client = requireStripe()
  const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
  const label =
    invoiceIds.length === 1
      ? "Cadogy invoice"
      : `${invoiceIds.length} Cadogy invoices`
  const session = await client.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    metadata: { kind: "batch", invoiceIds: invoiceIds.join(",") },
    payment_intent_data: {
      description: label,
      metadata: { invoiceIds: invoiceIds.join(",") },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: amount,
          product_data: { name: label },
        },
      },
    ],
    success_url: `${returnUrl}?payment=success`,
    cancel_url: returnUrl,
  })
  if (!session.url) throw new Error("Stripe did not return a checkout URL")
  return session.url
}

const customerFor = async (client: BillingClient) => {
  const existing = client.autopay.card?.stripeCustomerId
  if (existing) return existing
  const customer = await requireStripe().customers.create({
    email: client.email,
    name: client.company || client.name,
    metadata: { clientId: client.id },
  })
  return customer.id
}

export const createCardSetupCheckout = async (client: BillingClient) => {
  const returnUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
  const session = await requireStripe().checkout.sessions.create({
    mode: "setup",
    currency: client.currency.toLowerCase(),
    customer: await customerFor(client),
    metadata: { kind: "setup", clientId: client.id },
    success_url: `${returnUrl}?card=saved`,
    cancel_url: returnUrl,
  })
  if (!session.url) throw new Error("Stripe did not return a checkout URL")
  return session.url
}

export const readSavedCard = async (
  setupIntentId: string
): Promise<SavedCard | null> => {
  const client = requireStripe()
  const intent = await client.setupIntents.retrieve(setupIntentId, {
    expand: ["payment_method"],
  })
  const method = intent.payment_method
  const customer =
    typeof intent.customer === "string" ? intent.customer : intent.customer?.id
  if (!method || typeof method === "string" || !method.card || !customer)
    return null
  await client.customers.update(customer, {
    invoice_settings: { default_payment_method: method.id },
  })
  return {
    stripeCustomerId: customer,
    paymentMethodId: method.id,
    brand: method.card.brand,
    last4: method.card.last4,
    expMonth: method.card.exp_month,
    expYear: method.card.exp_year,
  }
}

const declineMessage = (error: unknown) =>
  error instanceof Stripe.errors.StripeError
    ? (error.decline_code ?? error.code ?? error.message)
    : "payment_failed"

export const stripeGateway: PaymentGateway = {
  chargeSavedCard: async (request) => {
    if (!stripe) return { ok: false, error: "stripe_not_configured" }
    try {
      const intent = await stripe.paymentIntents.create(
        {
          amount: request.amount,
          currency: request.currency.toLowerCase(),
          customer: request.customerId,
          payment_method: request.paymentMethodId,
          off_session: true,
          confirm: true,
          description: request.description,
          metadata: { invoiceId: request.invoiceId, kind: "autopay" },
        },
        { idempotencyKey: `autopay:${request.invoiceId}:${request.amount}` }
      )
      return intent.status === "succeeded"
        ? { ok: true, paymentId: intent.id }
        : { ok: false, error: intent.status }
    } catch (error) {
      return { ok: false, error: declineMessage(error) }
    }
  },
}

export const stripeRefunds = {
  refund: async (request: {
    readonly paymentIntentId: string
    readonly amount: number
    readonly idempotencyKey: string
  }) => {
    if (!stripe)
      return { ok: false as const, error: "Stripe is not configured" }
    try {
      const refund = await stripe.refunds.create(
        { payment_intent: request.paymentIntentId, amount: request.amount },
        { idempotencyKey: request.idempotencyKey }
      )
      return refund.status === "failed" || refund.status === "canceled"
        ? { ok: false as const, error: refund.failure_reason ?? refund.status }
        : { ok: true as const, refundId: refund.id }
    } catch (error) {
      return { ok: false as const, error: declineMessage(error) }
    }
  },
}

export const verifyStripeEvent = (payload: string, signature: string) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET)
    throw new Error("Stripe is not configured")
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  )
}
