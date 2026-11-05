type Construct<E> = (payload: string, signature: string, secret: string) => E

export type WebhookVerification<E> =
  | { readonly ok: true; readonly event: E }
  | { readonly ok: false; readonly reason: "not_configured" }
  | { readonly ok: false; readonly reason: "missing_signature" }
  | {
      readonly ok: false
      readonly reason: "bad_signature"
      readonly detail: string
    }

export const verifyWebhook = <E>({
  payload,
  signature,
  secret,
  construct,
}: {
  readonly payload: string
  readonly signature: string | null
  readonly secret: string | undefined
  readonly construct: Construct<E> | null
}): WebhookVerification<E> => {
  const signingSecret = secret?.trim()
  if (!signingSecret || !construct)
    return { ok: false, reason: "not_configured" }
  if (!signature) return { ok: false, reason: "missing_signature" }
  try {
    return { ok: true, event: construct(payload, signature, signingSecret) }
  } catch (error) {
    return {
      ok: false,
      reason: "bad_signature",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}
