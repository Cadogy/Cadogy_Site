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
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { ActionState } from "../server/actions"

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state) return null
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={state.ok ? "text-sm text-success" : "text-sm text-destructive"}
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
      <Button type="button" variant={variant} disabled={pending} onClick={run}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </Button>
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
  const [state, dispatch, pending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset()
  }, [state, resetOnSuccess])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5">
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {submitLabel}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  )
}
