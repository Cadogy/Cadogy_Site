"use client"

import {
  startTransition,
  useActionState,
  useTransition,
  type FormEvent,
} from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  type TicketStatus,
} from "../application/support-service"
import {
  openTicketAction,
  replyToTicketAction,
  setTicketStatusAction,
} from "../server/actions"

const submitWith =
  (dispatch: (data: FormData) => void, reset = false) =>
  (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(() => dispatch(data))
    if (reset) form.reset()
  }

export function NewTicketForm() {
  const [state, dispatch, pending] = useActionState(openTicketAction, null)
  return (
    <form
      onSubmit={submitWith(dispatch)}
      className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6"
    >
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Field id="subject" label="Subject">
        {(control) => (
          <Input {...control} name="subject" required maxLength={160} />
        )}
      </Field>
      <Field id="category" label="Category">
        {(control) => (
          <NativeSelect {...control} name="category" defaultValue="general">
            {TICKET_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>
      <Field id="message" label="How can we help?">
        {(control) => (
          <Textarea {...control} name="message" rows={6} required />
        )}
      </Field>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Send request
      </Button>
    </form>
  )
}

export function ReplyForm({
  ticketId,
  as,
}: {
  ticketId: string
  as: "user" | "admin"
}) {
  const [state, dispatch, pending] = useActionState(
    replyToTicketAction.bind(null, ticketId, as),
    null
  )
  return (
    <form onSubmit={submitWith(dispatch, true)} className="grid gap-3">
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
      <Field id="message" label="Reply">
        {(control) => (
          <Textarea {...control} name="message" rows={4} required />
        )}
      </Field>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Send reply
      </Button>
    </form>
  )
}

export function TicketStatusSelect({
  ticketId,
  status,
}: {
  ticketId: string
  status: TicketStatus
}) {
  const [pending, startStatus] = useTransition()
  return (
    <NativeSelect
      aria-label="Ticket status"
      defaultValue={status}
      disabled={pending}
      className="w-40 capitalize"
      onChange={(event) => {
        const next = event.target.value as TicketStatus
        startStatus(() => setTicketStatusAction(ticketId, next))
      }}
    >
      {TICKET_STATUSES.map((value) => (
        <option key={value} value={value}>
          {value.replace("-", " ")}
        </option>
      ))}
    </NativeSelect>
  )
}
