"use client"

import { useState, useTransition } from "react"
import {
  ROLE_LABELS,
  ROLES,
  type Role,
} from "@/features/auth/domain/permissions"

import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"

import { changeRoleAction, type RoleActionState } from "./actions"

export function RoleSelect({
  userId,
  email,
  role,
}: {
  userId: string
  email: string
  role: Role
}) {
  const [next, setNext] = useState<Role>(role)
  const [state, setState] = useState<RoleActionState>(null)
  const [pending, startTransition] = useTransition()

  const save = () => {
    if (
      !window.confirm(
        `Change ${email} to ${ROLE_LABELS[next]}? They'll be signed out.`
      )
    )
      return
    startTransition(async () => setState(await changeRoleAction(userId, next)))
  }

  return (
    <div className="grid gap-1 sm:justify-items-end">
      <div className="flex items-center gap-2">
        <label htmlFor={`role-${userId}`} className="sr-only">
          Role for {email}
        </label>
        <NativeSelect
          id={`role-${userId}`}
          value={next}
          onChange={(event) =>
            setNext(ROLES.find((r) => r === event.target.value) ?? role)
          }
          className="w-32"
        >
          {ROLES.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          onClick={save}
          disabled={pending || next === role}
        >
          Save
        </Button>
      </div>
      {state ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
