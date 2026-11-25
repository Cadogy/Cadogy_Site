"use client"

import { useFormAction } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PendingButton } from "@/components/ui/pending-button"

import {
  changePasswordAction,
  updateNameAction,
  type AccountAction,
} from "./auth-actions"
import { FormAlert } from "./auth-card"

function SettingsForm({
  action,
  success,
  submitLabel,
  children,
  resetOnSuccess = false,
}: {
  action: AccountAction
  success: string
  submitLabel: string
  children: (
    fieldError: (field: string) => string | undefined
  ) => React.ReactNode
  resetOnSuccess?: boolean
}) {
  const {
    state: result,
    pending,
    formRef,
    onSubmit,
  } = useFormAction(action, { resetOnSuccess })

  const fieldError = (field: string) =>
    result && !result.ok && result.field === field ? result.error : undefined

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-5" noValidate>
      {result?.ok ? <FormAlert tone="success">{success}</FormAlert> : null}
      {result && !result.ok && !result.field ? (
        <FormAlert>{result.error}</FormAlert>
      ) : null}
      {children(fieldError)}
      <PendingButton
        type="submit"
        pending={pending}
        className="justify-self-start"
      >
        {submitLabel}
      </PendingButton>
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
            hint="Change it in the section below."
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
            hint="At least 12 characters. Changing it signs you out on your other devices."
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
