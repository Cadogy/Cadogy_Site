"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"
import { ActionMessage, useFormAction } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PendingButton } from "@/components/ui/pending-button"
import { Textarea } from "@/components/ui/textarea"

import { TICKET_CATEGORIES } from "../application/support-service"
import { openTicketAction } from "../server/actions"
import { CATEGORY_GUIDE as GUIDE, type Category } from "./ticket-categories"

const SUBJECT_MAX = 160
const SUBJECT_MIN = 3
const MESSAGE_MIN = 10
const MESSAGE_MAX = 10_000
const DRAFT_KEY = "cadogy:support-draft"

const isCategory = (value: string | undefined): value is Category =>
  TICKET_CATEGORIES.some((category) => category.value === value)

type Draft = { category: Category; subject: string; message: string }

const readDraft = (): Partial<Draft> | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null
  } catch {
    return null
  }
}

const writeDraft = (draft: Draft | null) => {
  try {
    if (draft && (draft.subject.trim() || draft.message.trim()))
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    else window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Storage can be blocked (private windows); drafts are a convenience only.
  }
}

/**
 * Rendered in the browser only (see NewTicketFormLoader), so its first state
 * can come straight from a saved draft without a hydration mismatch.
 */
export function NewTicketForm({
  initialCategory,
  initialSubject = "",
}: {
  initialCategory?: string
  initialSubject?: string
}) {
  // A link that prefills the request (e.g. "Ask about this invoice") wins over
  // an old draft; otherwise pick up where the person left off.
  const prefilled = Boolean(initialSubject || isCategory(initialCategory))
  const [draft] = useState(() => (prefilled ? null : readDraft()))
  const [category, setCategory] = useState<Category>(
    isCategory(draft?.category)
      ? draft.category
      : isCategory(initialCategory)
        ? initialCategory
        : "general"
  )
  const [subject, setSubject] = useState(
    (draft?.subject ?? initialSubject).slice(0, SUBJECT_MAX)
  )
  const [message, setMessage] = useState(draft?.message ?? "")
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>(
    {}
  )
  const [restored, setRestored] = useState(
    Boolean(draft?.subject || draft?.message)
  )

  const send = async (
    previous: Parameters<typeof openTicketAction>[0],
    formData: FormData
  ) => {
    // Success redirects to the new request; a failure keeps the draft.
    writeDraft(null)
    const result = await openTicketAction(previous, formData)
    if (result && !result.ok) writeDraft({ category, subject, message })
    return result
  }
  const { state, pending, formRef, onSubmit } = useFormAction(send)

  const change = (next: Partial<Draft>) => {
    const merged = { category, subject, message, ...next }
    if (next.category !== undefined) setCategory(next.category)
    if (next.subject !== undefined) setSubject(next.subject)
    if (next.message !== undefined) setMessage(next.message)
    writeDraft(merged)
  }

  const guide = GUIDE[category]

  const submit = (event: FormEvent<HTMLFormElement>) => {
    const next = {
      subject:
        subject.trim().length < SUBJECT_MIN
          ? "Add a short subject."
          : undefined,
      message:
        message.trim().length < MESSAGE_MIN
          ? `Add a little more detail (at least ${MESSAGE_MIN} characters).`
          : undefined,
    }
    setErrors(next)
    if (next.subject || next.message) {
      event.preventDefault()
      document.getElementById(next.subject ? "subject" : "message")?.focus()
      return
    }
    onSubmit(event)
  }

  const sendWithShortcut = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const discardDraft = () => {
    change({ category: "general", subject: "", message: "" })
    setRestored(false)
  }

  const messageLength = message.trim().length

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="grid gap-8"
      aria-describedby={restored ? "draft-note" : undefined}
    >
      {state && !state.ok ? <ActionMessage state={state} /> : null}
      {restored ? (
        <p
          id="draft-note"
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field border px-4 py-3 text-sm text-muted-foreground"
        >
          We kept the request you didn&apos;t send.
          <button
            type="button"
            onClick={discardDraft}
            className="min-h-11 text-foreground underline underline-offset-4 sm:min-h-0"
          >
            Start over
          </button>
        </p>
      ) : null}

      <fieldset className="@container grid gap-3">
        <legend className="mb-3 text-sm font-medium">
          What&apos;s this about?
        </legend>
        <div className="grid gap-2 @md:grid-cols-2 @md:gap-3 @3xl:grid-cols-3">
          {TICKET_CATEGORIES.map((option) => {
            const { icon: Icon, blurb } = GUIDE[option.value]
            const checked = category === option.value
            return (
              <label
                key={option.value}
                className={cn(
                  "relative flex min-h-11 cursor-pointer items-start gap-3 rounded-field border px-4 py-3 transition-colors @md:py-4",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                  checked
                    ? "border-foreground bg-foreground/5"
                    : "hover:border-foreground/40 hover:bg-foreground/[0.03]"
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  checked={checked}
                  onChange={() => change({ category: option.value })}
                  className="sr-only"
                />
                <Icon
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    checked ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <span className="grid gap-0.5">
                  <span className="font-medium">{option.label}</span>
                  <span className="hidden text-sm text-muted-foreground @md:block">
                    {blurb}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <Field
        id="subject"
        label="Subject"
        error={errors.subject}
        hint={`${subject.length}/${SUBJECT_MAX}`}
      >
        {(control) => (
          <Input
            {...control}
            name="subject"
            value={subject}
            maxLength={SUBJECT_MAX}
            placeholder={guide.subject}
            autoComplete="off"
            enterKeyHint="next"
            onChange={(event) => {
              change({ subject: event.target.value })
              if (errors.subject) setErrors({ ...errors, subject: undefined })
            }}
            required
          />
        )}
      </Field>

      <Field
        id="message"
        label="Details"
        error={errors.message}
        hint={`${guide.prompt} ${
          messageLength < MESSAGE_MIN
            ? `At least ${MESSAGE_MIN} characters.`
            : `${messageLength.toLocaleString()} characters.`
        }`}
      >
        {(control) => (
          <Textarea
            {...control}
            name="message"
            value={message}
            rows={8}
            maxLength={MESSAGE_MAX}
            className="min-h-48"
            onKeyDown={sendWithShortcut}
            onChange={(event) => {
              change({ message: event.target.value })
              if (errors.message) setErrors({ ...errors, message: undefined })
            }}
            required
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PendingButton type="submit" pending={pending}>
          Send request
        </PendingButton>
        <p className="text-sm text-muted-foreground">
          <span className="hidden [@media(pointer:fine)]:inline">
            <kbd className="font-sans">Ctrl</kbd> or{" "}
            <kbd className="font-sans">⌘</kbd> +{" "}
            <kbd className="font-sans">Enter</kbd> to send.{" "}
          </span>
          Your draft is saved on this device.
        </p>
      </div>
    </form>
  )
}
