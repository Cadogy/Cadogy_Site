"use client"

import { startTransition, useActionState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import type { AccountResult } from "../application/account-service"
import { changePasswordAction, updateNameAction } from "../server/actions"
import { FormAlert } from "./auth-card"

type Action = (
  previous: AccountResult | null,
  formData: FormData
) => Promise<AccountResult>

function SettingsForm({
  action,
  success,
  submitLabel,
  children,
  resetOnSuccess = false,
}: {
  action: Action
  success: string
  submitLabel: string
  children: (
    fieldError: (field: string) => string | undefined
  ) => React.ReactNode
  resetOnSuccess?: boolean
}) {
  const [result, dispatch, pending] = useActionState(action, null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      dispatch(data)
      if (resetOnSuccess) form.reset()
    })
  }

  const fieldError = (field: string) =>
    result && !result.ok && result.field === field ? result.error : undefined

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {result?.ok ? <FormAlert tone="success">{success}</FormAlert> : null}
      {result && !result.ok && !result.field ? (
        <FormAlert>{result.error}</FormAlert>
      ) : null}
      {children(fieldError)}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {submitLabel}
      </Button>
    </form>
  )
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  return (
    <SettingsForm
      action={updateNameAction}
      success="Profile updated."
      submitLabel="Save profile"
    >
      {(fieldError) => (
        <>
          <Field id="name" label="Name" error={fieldError("name")}>
            {(control) => (
              <Input
                {...control}
                name="name"
                defaultValue={name}
                autoComplete="name"
              />
            )}
          </Field>
          <Field
            id="email"
            label="Email"
            hint="Contact us to change the email on your account."
          >
            {(control) => (
              <Input {...control} value={email} readOnly disabled />
            )}
          </Field>
        </>
      )}
    </SettingsForm>
  )
}

export function ChangePasswordForm() {
  return (
    <SettingsForm
      action={changePasswordAction}
      success="Password updated."
      submitLabel="Update password"
      resetOnSuccess
    >
      {(fieldError) => (
        <>
          <Field
            id="currentPassword"
            label="Current password"
            error={fieldError("currentPassword")}
          >
            {(control) => (
              <Input
                {...control}
                name="currentPassword"
                type="password"
                autoComplete="current-password"
              />
            )}
          </Field>
          <Field
            id="password"
            label="New password"
            hint="At least 10 characters, with upper- and lowercase letters and a number."
            error={fieldError("password")}
          >
            {(control) => (
              <Input
                {...control}
                name="password"
                type="password"
                autoComplete="new-password"
              />
            )}
          </Field>
          <Field
            id="confirmPassword"
            label="Confirm new password"
            error={fieldError("confirmPassword")}
          >
            {(control) => (
              <Input
                {...control}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
              />
            )}
          </Field>
        </>
      )}
    </SettingsForm>
  )
}
