"use client"

import { useTransition } from "react"

import { isOneOf } from "@/lib/is-one-of"
import { ActionMessage, useFormAction } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { NativeSelect } from "@/components/ui/native-select"
import { PendingButton } from "@/components/ui/pending-button"
import { Textarea } from "@/components/ui/textarea"

import {
  TICKET_STATUSES,
  type TicketStatus,
} from "../application/support-service"
import { replyToTicketAction, setTicketStatusAction } from "../server/actions"

const isTicketStatus = isOneOf(TICKET_STATUSES)

export function ReplyForm({
  ticketId,
  as,
}: {
  ticketId: string
  as: "user" | "admin"
}) {
  const { state, pending, formRef, onSubmit } = useFormAction(
    replyToTicketAction.bind(null, ticketId, as),
    { resetOnSuccess: true }
  )
  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3">
      <ActionMessage state={state} />
      <Field id="message" label="Reply">
        {(control) => (
          <Textarea
            {...control}
            name="message"
            rows={4}
            required
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
          />
        )}
      </Field>
      <PendingButton
        type="submit"
        pending={pending}
        className="justify-self-start"
      >
        Send reply
      </PendingButton>
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
        const next = event.target.value
        if (!isTicketStatus(next)) return
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
