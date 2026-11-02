import { authClient, humanCheckHeaders } from "@/features/auth/client"

import { authErrorMessage } from "./auth-errors"

type AccountResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string; readonly field?: string }

export type AccountAction = (
  previous: AccountResult | null,
  formData: FormData
) => Promise<AccountResult>

type ClientResult = {
  readonly error: { code?: string; message?: string; status: number } | null
}

const OK: AccountResult = { ok: true }

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "")

const fieldError = (field: string, error: string): AccountResult => ({
  ok: false,
  error,
  field,
})

const passwordProblem = (password: string) => {
  if (password.length < 12) return "Use at least 12 characters."
  if (password.length > 128) return "Use at most 128 characters."
  return null
}

const newPasswordProblem = (formData: FormData) => {
  const password = text(formData, "password")
  const tooWeak = passwordProblem(password)
  if (tooWeak) return fieldError("password", tooWeak)
  if (password !== text(formData, "confirmPassword"))
    return fieldError("confirmPassword", "Passwords don't match.")
  return null
}

const toResult = ({ error }: ClientResult): AccountResult =>
  error ? { ok: false, error: authErrorMessage(error) } : OK

export const registerAction: AccountAction = async (_previous, formData) => {
  const name = text(formData, "name").trim()
  const password = text(formData, "password")
  if (!name) return fieldError("name", "Enter your name.")
  if (name.length > 120)
    return fieldError("name", "Use at most 120 characters.")
  const tooWeak = passwordProblem(password)
  if (tooWeak) return fieldError("password", tooWeak)
  return toResult(
    await authClient.signUp.email(
      {
        name,
        email: text(formData, "email").trim(),
        password,
        callbackURL: "/verify-email",
      },
      { headers: humanCheckHeaders(text(formData, "turnstileToken")) }
    )
  )
}

export const requestPasswordResetAction: AccountAction = async (
  _previous,
  formData
) =>
  toResult(
    await authClient.requestPasswordReset(
      { email: text(formData, "email").trim(), redirectTo: "/reset-password" },
      { headers: humanCheckHeaders(text(formData, "turnstileToken")) }
    )
  )

export const resetPasswordAction: AccountAction = async (_previous, formData) =>
  newPasswordProblem(formData) ??
  toResult(
    await authClient.resetPassword({
      newPassword: text(formData, "password"),
      token: text(formData, "token"),
    })
  )

export const changePasswordAction: AccountAction = async (
  _previous,
  formData
) => {
  if (!text(formData, "currentPassword"))
    return fieldError("currentPassword", "Enter your current password.")
  return (
    newPasswordProblem(formData) ??
    toResult(
      await authClient.changePassword({
        currentPassword: text(formData, "currentPassword"),
        newPassword: text(formData, "password"),
        revokeOtherSessions: true,
      })
    )
  )
}

export const updateNameAction: AccountAction = async (_previous, formData) => {
  const name = text(formData, "name").trim()
  if (name.length > 120)
    return fieldError("name", "Use at most 120 characters.")
  return toResult(await authClient.updateUser({ name }))
}
