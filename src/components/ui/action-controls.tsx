"use client"

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react"

import type { ActionState } from "@/lib/action-state"
import { cn } from "@/lib/utils"

import { PendingButton } from "./pending-button"

export function useFormAction<S extends { readonly ok: boolean }>(
  action: (previous: S | null, formData: FormData) => Promise<S | null>,
  { resetOnSuccess = false }: { resetOnSuccess?: boolean } = {}
) {
  const [state, dispatch, pending] = useActionState<S | null, FormData>(
    action,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset()
  }, [state, resetOnSuccess])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }

  return { state, pending, formRef, onSubmit }
}

export function ActionMessage({
  state,
  className,
}: {
  state: ActionState
  className?: string
}) {
  if (!state) return null
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "text-sm",
        state.ok ? "text-success" : "text-destructive",
        className
      )}
    >
      {state.message}
    </p>
  )
}

export function ActionButton({
  action,
  children,
  variant = "outline",
  confirm,
}: {
  action: () => Promise<ActionState>
  children: ReactNode
  variant?: "outline" | "ghost" | "destructive" | "secondary"
  confirm?: string
}) {
  const [pending, start] = useTransition()
  const [state, setState] = useState<ActionState>(null)
  const run = () => {
    if (confirm && !window.confirm(confirm)) return
    start(async () => setState(await action()))
  }
  return (
    <span className="inline-grid gap-1">
      <PendingButton
        type="button"
        variant={variant}
        pending={pending}
        onClick={run}
      >
        {children}
      </PendingButton>
      {state && !state.ok ? <ActionMessage state={state} /> : null}
    </span>
  )
}

export function ActionForm({
  action,
  submitLabel,
  children,
  resetOnSuccess = true,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>
  submitLabel: string
  children: ReactNode
  resetOnSuccess?: boolean
}) {
  const { state, pending, formRef, onSubmit } = useFormAction(action, {
    resetOnSuccess,
  })

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-5">
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <PendingButton type="submit" pending={pending}>
          {submitLabel}
        </PendingButton>
        <ActionMessage state={state} />
      </div>
    </form>
  )
}
