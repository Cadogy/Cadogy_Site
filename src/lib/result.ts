export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })

export const fail = <T>(error: string): Result<T> => ({ ok: false, error })

export const firstIssue = (error: {
  readonly issues: readonly { readonly message: string }[]
}) => error.issues[0]?.message ?? "Please check the form."
