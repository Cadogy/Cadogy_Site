"use client"

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { HumanCheck } from "@/components/security/human-check"

import type { SubmissionResult } from "../application/inquiry-service"
import { BUDGETS, PROJECT_TYPES, TIMELINES } from "../domain/schema"
import { submitInquiry } from "../server/actions"

const FORM_MESSAGES: Partial<Record<SubmissionResult["status"], string>> = {
  rate_limited:
    "We've received too many messages from you in a short time. Please try again later or email hello@cadogy.com.",
  verification_failed:
    "We couldn't verify you're human. Please complete the check and try again.",
  expired:
    "This form has been open for a while. Please refresh the page and send it again.",
}

export function ContactForm({
  formToken,
  turnstileSiteKey,
}: {
  formToken: string
  turnstileSiteKey: string | undefined
}) {
  const [result, formAction, pending] = useActionState(submitInquiry, null)
  const [turnstileToken, setTurnstileToken] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => formAction(data))
  }

  if (result?.status === "accepted") {
    return (
      <div role="status" className="rounded-xl border bg-card p-8">
        <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
        <h2 className="mt-4 text-h3">Thanks — your message is on its way.</h2>
        <p className="mt-2 text-muted-foreground">
          One of the founders will read it and reply to you personally.
        </p>
      </div>
    )
  }

  const errors = result?.status === "invalid" ? result.fieldErrors : {}
  const formMessage = result ? FORM_MESSAGES[result.status] : undefined

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      {formMessage ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
        >
          {formMessage}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              autoComplete="name"
              required
              maxLength={120}
            />
          )}
        </Field>
        <Field id="email" label="Work email" error={errors.email}>
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          )}
        </Field>
      </div>

      <Field id="company" label="Company" optional error={errors.company}>
        {(control) => (
          <Input
            {...control}
            name="company"
            autoComplete="organization"
            maxLength={160}
          />
        )}
      </Field>

      <Field
        id="projectType"
        label="What do you need help with?"
        error={errors.projectType}
      >
        {(control) => (
          <NativeSelect
            {...control}
            name="projectType"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Choose one
            </option>
            {PROJECT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="budget" label="Budget" optional error={errors.budget}>
          {(control) => (
            <NativeSelect {...control} name="budget" defaultValue="">
              <option value="">Select a range</option>
              {BUDGETS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field id="timeline" label="Timeline" optional error={errors.timeline}>
          {(control) => (
            <NativeSelect {...control} name="timeline" defaultValue="">
              <option value="">Select a timeline</option>
              {TIMELINES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>

      <Field
        id="message"
        label="Tell us about the project"
        hint="What are you building, where are you today, and what does success look like?"
        error={errors.message}
      >
        {(control) => (
          <Textarea
            {...control}
            name="message"
            required
            minLength={20}
            maxLength={5000}
            rows={6}
          />
        )}
      </Field>

      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px overflow-hidden"
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input type="hidden" name="formToken" value={formToken} />
      <input type="hidden" name="turnstileToken" value={turnstileToken} />

      <HumanCheck siteKey={turnstileSiteKey} onToken={setTurnstileToken} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? "Sending…" : "Send message"}
        </Button>
        <p className="text-sm text-muted-foreground">
          By sending this form you agree to our{" "}
          <a
            href="/policies/privacy-policy"
            className="underline underline-offset-4"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </form>
  )
}
