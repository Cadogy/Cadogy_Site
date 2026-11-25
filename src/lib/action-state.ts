export type ActionState = {
  readonly ok: boolean
  readonly message: string
} | null

type Outcome =
  { readonly ok: true } | { readonly ok: false; readonly error: string }

export const toState = (
  outcome: Outcome,
  success: string
): NonNullable<ActionState> =>
  outcome.ok
    ? { ok: true, message: success }
    : { ok: false, message: outcome.error }
