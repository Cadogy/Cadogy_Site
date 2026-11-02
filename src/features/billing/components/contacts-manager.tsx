"use client"

import { useState, useTransition, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import type { ContactRole } from "../domain/contacts"

type Result = { readonly ok: boolean; readonly message: string }

type TeamContact = {
  readonly email: string
  readonly name: string
  readonly role: ContactRole
}

const ROLE_LABELS: Record<ContactRole, string> = {
  billing: "Billing",
  viewer: "Viewer",
}

const ROLE_HELP =
  "Billing contacts get invoices, pay and manage cards and the team. Viewers can see invoices and pay them."

const roleOf = (value: string): ContactRole =>
  value === "billing" ? "billing" : "viewer"

export function ContactsManager({
  primary,
  contacts,
  canManage,
  onInvite,
  onRoleChange,
  onRemove,
}: {
  primary: { readonly email: string; readonly name: string }
  contacts: readonly TeamContact[]
  canManage: boolean
  onInvite: (input: TeamContact) => Promise<Result>
  onRoleChange: (email: string, role: ContactRole) => Promise<Result>
  onRemove: (email: string) => Promise<Result>
}) {
  const [result, setResult] = useState<Result | null>(null)
  const [pending, start] = useTransition()

  const run = (action: () => Promise<Result>) =>
    start(async () => setResult(await action()))

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    run(async () => {
      const outcome = await onInvite({
        email: String(data.get("email") ?? "").trim(),
        name: String(data.get("name") ?? "").trim(),
        role: roleOf(String(data.get("role"))),
      })
      if (outcome.ok) form.reset()
      return outcome
    })
  }

  return (
    <div className="grid gap-6">
      <ul className="rule-list">
        <li
          aria-label={primary.email}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
        >
          <span className="grid min-w-0">
            <span className="truncate font-medium">
              {primary.name || primary.email}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {primary.email}
            </span>
          </span>
          <span className="text-sm text-muted-foreground">
            Primary · Billing
          </span>
        </li>
        {contacts.map((contact) => (
          <li
            key={contact.email}
            aria-label={contact.email}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
          >
            <span className="grid min-w-0">
              <span className="truncate font-medium">
                {contact.name || contact.email}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {contact.email}
              </span>
            </span>
            {canManage ? (
              <span className="flex items-center gap-2">
                <label htmlFor={`access-${contact.email}`} className="sr-only">
                  Access for {contact.email}
                </label>
                <NativeSelect
                  id={`access-${contact.email}`}
                  value={contact.role}
                  disabled={pending}
                  onChange={(event) =>
                    run(() =>
                      onRoleChange(contact.email, roleOf(event.target.value))
                    )
                  }
                  className="w-32"
                >
                  <option value="billing">Billing</option>
                  <option value="viewer">Viewer</option>
                </NativeSelect>
                <Button
                  variant="ghost"
                  disabled={pending}
                  aria-label={`Remove ${contact.email}`}
                  onClick={() => {
                    if (window.confirm(`Remove ${contact.email}'s access?`))
                      run(() => onRemove(contact.email))
                  }}
                >
                  Remove
                </Button>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {ROLE_LABELS[contact.role]}
              </span>
            )}
          </li>
        ))}
      </ul>

      {result ? (
        <p
          role={result.ok ? "status" : "alert"}
          className={
            result.ok ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {result.message}
        </p>
      ) : null}

      {canManage ? (
        <form onSubmit={invite} className="grid gap-5">
          <p className="text-sm text-muted-foreground">{ROLE_HELP}</p>
          <div className="grid gap-5 sm:grid-cols-[2fr_2fr_1fr]">
            <Field id="invite-email" label="Email">
              {(control) => (
                <Input
                  {...control}
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                />
              )}
            </Field>
            <Field id="invite-name" label="Name" optional>
              {(control) => (
                <Input {...control} name="name" autoComplete="off" />
              )}
            </Field>
            <Field id="invite-role" label="Access">
              {(control) => (
                <NativeSelect {...control} name="role" defaultValue="viewer">
                  <option value="viewer">Viewer</option>
                  <option value="billing">Billing</option>
                </NativeSelect>
              )}
            </Field>
          </div>
          <div>
            <Button type="submit" variant="outline" disabled={pending}>
              Invite
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only billing contacts can change who has access.
        </p>
      )}
    </div>
  )
}
