import { NextResponse, type NextRequest } from "next/server"
import { readCheckoutSession } from "@/features/billing/application/stripe-events"
import { billing, billingEngine } from "@/features/billing/server/billing"
import { ProcessedStripeEventModel } from "@/features/billing/server/models"
import {
  readSavedCard,
  verifyStripeEvent,
} from "@/features/billing/server/stripe"
import type Stripe from "stripe"

import { connectToDatabase } from "@/lib/mongodb"

const DUPLICATE_KEY = 11000

const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === DUPLICATE_KEY

const claimEvent = async (eventId: string) => {
  await connectToDatabase()
  try {
    await ProcessedStripeEventModel.create({ _id: eventId })
    return true
  } catch (error) {
    if (isDuplicateKeyError(error)) return false
    throw error
  }
}

const releaseEvent = (eventId: string) =>
  ProcessedStripeEventModel.deleteOne({ _id: eventId })

const parseEvent = (
  payload: string,
  signature: string
): Stripe.Event | null => {
  try {
    return verifyStripeEvent(payload, signature)
  } catch {
    return null
  }
}

const logFailure = (subject: string, error: string) =>
  console.error(`Stripe ${subject} not recorded: ${error}`)

const handleCheckoutCompleted = async (event: Stripe.Event) => {
  const session = event.data.object as Stripe.Checkout.Session
  const outcome = readCheckoutSession(session)
  const paidAt = new Date(event.created * 1000)

  if (outcome.kind === "invoice") {
    const result = await billing.recordStripePayment({
      invoiceId: outcome.invoiceId,
      amount: outcome.amount,
      eventId: event.id,
      paidAt,
    })
    if (!result.ok) logFailure(`payment for ${outcome.invoiceId}`, result.error)
  }

  if (outcome.kind === "batch") {
    const result = await billingEngine.applyBatchPayment({
      invoiceIds: outcome.invoiceIds,
      amount: outcome.amount,
      eventId: event.id,
      paidAt,
    })
    if (!result.ok) logFailure(`batch payment ${event.id}`, result.error)
    if (result.ok && result.value.unallocated > 0)
      console.error(
        `Stripe batch payment ${event.id} left ${result.value.unallocated} unallocated`
      )
  }

  if (outcome.kind === "setup") {
    const card = await readSavedCard(outcome.setupIntentId)
    if (!card) return logFailure(`card for ${outcome.clientId}`, "no card")
    const result = await billing.saveCard(outcome.clientId, card)
    if (!result.ok) logFailure(`card for ${outcome.clientId}`, result.error)
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  if (!signature)
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  const event = parseEvent(await request.text(), signature)
  if (!event)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  if (event.type !== "checkout.session.completed")
    return NextResponse.json({ received: true })

  if (!(await claimEvent(event.id)))
    return NextResponse.json({ received: true, duplicate: true })

  try {
    await handleCheckoutCompleted(event)
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
