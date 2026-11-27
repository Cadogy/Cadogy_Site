import { NextResponse, type NextRequest } from "next/server"
import {
  readCheckoutSession,
  readMoneyEvent,
  type MoneyEvent,
} from "@/features/billing/application/stripe-events"
import { formatMoney } from "@/features/billing/domain/format"
import type { Invoice } from "@/features/billing/domain/invoice"
import {
  billing,
  billingEngine,
  credits,
} from "@/features/billing/server/billing"
import {
  claimEvent,
  releaseEvent,
} from "@/features/billing/server/processed-events"
import {
  readSavedCard,
  verifyStripeEvent,
} from "@/features/billing/server/stripe"
import type Stripe from "stripe"

import { env } from "@/env"
import { sendDisputeAlert, sendUnappliedPaymentAlert } from "@/lib/email"

const logFailure = (subject: string, error: string) =>
  console.error(`Stripe ${subject} not recorded: ${error}`)

const alertCredited = (invoice: Invoice, amount: number) =>
  sendUnappliedPaymentAlert({
    reference: invoice.number ?? "an invoice",
    amount: formatMoney(amount, invoice.currency),
    url: `${env.NEXT_PUBLIC_APP_URL}/admin/billing/clients/${invoice.clientId}`,
  })

const handleCheckoutCompleted = async (event: Stripe.Event) => {
  const session = event.data.object as Stripe.Checkout.Session
  const outcome = readCheckoutSession(session)
  const paidAt = new Date(event.created * 1000)

  if (outcome.kind === "invoice") {
    // Money that can't go on the invoice (paid meanwhile, voided, …) is kept
    // as client credit and staff are told, instead of being dropped.
    const result = await credits.settleCardPayment({
      invoiceId: outcome.invoiceId,
      amount: outcome.amount,
      eventId: event.id,
      paidAt,
      paymentIntentId: outcome.paymentIntentId,
    })
    if (!result.ok)
      throw new Error(`Payment for ${outcome.invoiceId}: ${result.error}`)
    if (result.value.credited > 0)
      await alertCredited(result.value.invoice, result.value.credited)
  }

  if (outcome.kind === "batch") {
    const result = await billingEngine.applyBatchPayment({
      invoiceIds: outcome.invoiceIds,
      amount: outcome.amount,
      eventId: event.id,
      paidAt,
      paymentIntentId: outcome.paymentIntentId,
    })
    if (!result.ok)
      throw new Error(`Batch payment ${event.id}: ${result.error}`)
    const leftover = result.value.unallocated
    const [firstId] = outcome.invoiceIds
    const invoice =
      leftover > 0 && firstId ? await billing.getInvoice(firstId) : null
    if (invoice) {
      const credited = await credits.creditUnappliedPayment({
        clientId: invoice.clientId,
        amount: leftover,
        currency: invoice.currency,
        paymentIntentId: outcome.paymentIntentId ?? event.id,
        reason:
          "Card payment for several invoices that was more than they owed",
      })
      if (!credited.ok)
        throw new Error(`Batch payment ${event.id}: ${credited.error}`)
      await alertCredited(invoice, leftover)
    }
  }

  if (outcome.kind === "setup") {
    const card = await readSavedCard(outcome.setupIntentId)
    if (!card) return logFailure(`card for ${outcome.clientId}`, "no card")
    const result = await billing.saveCard(outcome.clientId, card)
    if (!result.ok) logFailure(`card for ${outcome.clientId}`, result.error)
  }
}

type StripeMoneyEvent =
  | Stripe.RefundCreatedEvent
  | Stripe.ChargeDisputeCreatedEvent
  | Stripe.ChargeDisputeClosedEvent

const MONEY_EVENTS = new Set([
  "refund.created",
  "charge.dispute.created",
  "charge.dispute.closed",
])

const isMoneyEvent = (event: Stripe.Event): event is StripeMoneyEvent =>
  MONEY_EVENTS.has(event.type)

const isHandled = (event: Stripe.Event) =>
  event.type === "checkout.session.completed" || isMoneyEvent(event)

const alertStaff = (
  invoice: Invoice,
  amount: number,
  outcome: "opened" | "won" | "lost"
) =>
  sendDisputeAlert({
    invoiceNumber: invoice.number ?? "an invoice",
    amount: formatMoney(amount, invoice.currency),
    url: `${env.NEXT_PUBLIC_APP_URL}/admin/billing/invoices/${invoice.id}`,
    outcome,
  })

const handleMoneyEvent = async (money: MoneyEvent) => {
  if (money.kind === "refund") {
    const result = await credits.recordStripeRefund(money)
    if (!result.ok) logFailure(`refund ${money.refundId}`, result.error)
  }

  if (money.kind === "dispute_opened") {
    const result = await credits.openDispute(money)
    if (!result.ok)
      return logFailure(`dispute ${money.disputeId}`, result.error)
    await alertStaff(result.value, money.amount, "opened")
  }

  if (money.kind === "dispute_closed") {
    const result = await credits.closeDispute(money)
    if (!result.ok)
      return logFailure(`dispute ${money.disputeId}`, result.error)
    await alertStaff(result.value, money.amount, money.won ? "won" : "lost")
  }
}

const handleEvent = (event: Stripe.Event) =>
  isMoneyEvent(event)
    ? handleMoneyEvent(readMoneyEvent(event))
    : handleCheckoutCompleted(event)

export async function POST(request: NextRequest) {
  const verified = verifyStripeEvent(
    await request.text(),
    request.headers.get("stripe-signature")
  )
  if (!verified.ok && verified.reason === "not_configured") {
    console.error(
      "Stripe webhook rejected: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set in this environment"
    )
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    )
  }
  if (!verified.ok && verified.reason === "missing_signature")
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  if (!verified.ok) {
    console.warn(
      `Stripe webhook rejected: ${verified.detail} Check that STRIPE_WEBHOOK_SECRET is this endpoint's signing secret, in the same mode (live or test).`
    )
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }
  const { event } = verified
  if (!isHandled(event)) return NextResponse.json({ received: true })

  if (!(await claimEvent(event.id)))
    return NextResponse.json({ received: true, duplicate: true })

  try {
    await handleEvent(event)
    return NextResponse.json({ received: true })
  } catch (error) {
    await releaseEvent(event.id)
    console.error("Stripe webhook handling failed", error)
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    )
  }
}
