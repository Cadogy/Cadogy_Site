type CheckoutSessionLike = {
  readonly mode: string
  readonly payment_status: string
  readonly amount_total: number | null
  readonly metadata: Record<string, string> | null
  readonly setup_intent?: string | { readonly id: string } | null
}

export type CheckoutOutcome =
  | {
      readonly kind: "invoice"
      readonly invoiceId: string
      readonly amount: number
    }
  | {
      readonly kind: "batch"
      readonly invoiceIds: readonly string[]
      readonly amount: number
    }
  | {
      readonly kind: "setup"
      readonly clientId: string
      readonly setupIntentId: string
    }
  | { readonly kind: "ignored" }

const IGNORED: CheckoutOutcome = { kind: "ignored" }

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
      ? { kind: "batch", invoiceIds, amount }
      : IGNORED
  }
  return metadata.invoiceId
    ? { kind: "invoice", invoiceId: metadata.invoiceId, amount }
    : IGNORED
}

export const readCheckoutSession = (
  session: CheckoutSessionLike
): CheckoutOutcome =>
  session.mode === "setup" ? readSetup(session) : readPayment(session)
