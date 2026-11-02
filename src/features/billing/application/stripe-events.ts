type CheckoutSessionLike = {
  readonly mode: string
  readonly payment_status: string
  readonly amount_total: number | null
  readonly metadata: Record<string, string> | null
  readonly setup_intent?: string | { readonly id: string } | null
  readonly payment_intent?: string | { readonly id: string } | null
}

export type CheckoutOutcome =
  | {
      readonly kind: "invoice"
      readonly invoiceId: string
      readonly amount: number
      readonly paymentIntentId?: string
    }
  | {
      readonly kind: "batch"
      readonly invoiceIds: readonly string[]
      readonly amount: number
      readonly paymentIntentId?: string
    }
  | {
      readonly kind: "setup"
      readonly clientId: string
      readonly setupIntentId: string
    }
  | { readonly kind: "ignored" }

const IGNORED: CheckoutOutcome = { kind: "ignored" }

const idOf = (value: string | { readonly id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id

const readSetup = (session: CheckoutSessionLike): CheckoutOutcome => {
  const clientId = session.metadata?.clientId
  const intent = session.setup_intent
  const setupIntentId = typeof intent === "string" ? intent : intent?.id
  if (session.metadata?.kind !== "setup" || !clientId || !setupIntentId)
    return IGNORED
  return { kind: "setup", clientId, setupIntentId }
}

const readPayment = (session: CheckoutSessionLike): CheckoutOutcome => {
  const amount = session.amount_total
  if (session.payment_status !== "paid" || !amount) return IGNORED
  const metadata = session.metadata ?? {}
  if (metadata.kind === "batch") {
    const invoiceIds = (metadata.invoiceIds ?? "").split(",").filter(Boolean)
    return invoiceIds.length > 0
      ? {
          kind: "batch",
          invoiceIds,
          amount,
          paymentIntentId: idOf(session.payment_intent),
        }
      : IGNORED
  }
  return metadata.invoiceId
    ? {
        kind: "invoice",
        invoiceId: metadata.invoiceId,
        amount,
        paymentIntentId: idOf(session.payment_intent),
      }
    : IGNORED
}

export const readCheckoutSession = (
  session: CheckoutSessionLike
): CheckoutOutcome =>
  session.mode === "setup" ? readSetup(session) : readPayment(session)

type MoneyObject = {
  readonly id?: string
  readonly amount?: number
  readonly status?: string | null
  readonly payment_intent?: string | { readonly id: string } | null
}

export type MoneyEvent =
  | {
      readonly kind: "refund"
      readonly refundId: string
      readonly amount: number
      readonly paymentIntentId: string
    }
  | {
      readonly kind: "dispute_opened"
      readonly disputeId: string
      readonly amount: number
      readonly paymentIntentId: string
    }
  | {
      readonly kind: "dispute_closed"
      readonly disputeId: string
      readonly amount: number
      readonly paymentIntentId: string
      readonly won: boolean
    }
  | { readonly kind: "ignored" }

const IGNORED_EVENT: MoneyEvent = { kind: "ignored" }

export const readMoneyEvent = (event: {
  readonly type: string
  readonly data: { readonly object: MoneyObject }
}): MoneyEvent => {
  const object = event.data.object
  const paymentIntentId = idOf(object.payment_intent)
  if (!object.id || !object.amount || !paymentIntentId) return IGNORED_EVENT
  const base = { amount: object.amount, paymentIntentId }
  if (event.type === "refund.created")
    return object.status === "succeeded" || object.status === "pending"
      ? { kind: "refund", refundId: object.id, ...base }
      : IGNORED_EVENT
  if (event.type === "charge.dispute.created")
    return { kind: "dispute_opened", disputeId: object.id, ...base }
  if (event.type === "charge.dispute.closed")
    return {
      kind: "dispute_closed",
      disputeId: object.id,
      ...base,
      won: object.status === "won",
    }
  return IGNORED_EVENT
}
