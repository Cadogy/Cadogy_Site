"use client"

import { startTransition, useActionState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

import type { BillingClient } from "../application/ports"
import { CURRENCIES } from "../domain/schema"
import { saveClientAction } from "../server/actions"

export function ClientForm({ client }: { client: BillingClient | null }) {
  const [state, dispatch, pending] = useActionState(
    saveClientAction.bind(null, client?.id ?? null),
    null
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-xl border bg-card p-5 sm:p-6"
    >
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
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Contact name">
          {(control) => (
            <Input
              {...control}
              name="name"
              defaultValue={client?.name}
              required
            />
          )}
        </Field>
        <Field id="company" label="Company" optional>
          {(control) => (
            <Input {...control} name="company" defaultValue={client?.company} />
          )}
        </Field>
        <Field id="email" label="Billing email">
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              defaultValue={client?.email}
              required
            />
          )}
        </Field>
      </div>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-3 font-semibold">Address</legend>
        <Field
          id="line1"
          label="Street address"
          optional
          className="sm:col-span-2"
        >
          {(control) => (
            <Input
              {...control}
              name="line1"
              defaultValue={client?.address.line1}
            />
          )}
        </Field>
        <Field
          id="line2"
          label="Suite or unit"
          optional
          className="sm:col-span-2"
        >
          {(control) => (
            <Input
              {...control}
              name="line2"
              defaultValue={client?.address.line2}
            />
          )}
        </Field>
        <Field id="city" label="City" optional>
          {(control) => (
            <Input
              {...control}
              name="city"
              defaultValue={client?.address.city}
            />
          )}
        </Field>
        <Field id="region" label="State or region" optional>
          {(control) => (
            <Input
              {...control}
              name="region"
              defaultValue={client?.address.region}
            />
          )}
        </Field>
        <Field id="postalCode" label="Postal code" optional>
          {(control) => (
            <Input
              {...control}
              name="postalCode"
              defaultValue={client?.address.postalCode}
            />
          )}
        </Field>
        <Field id="country" label="Country" optional>
          {(control) => (
            <Input
              {...control}
              name="country"
              defaultValue={client?.address.country}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="mb-3 font-semibold">Billing defaults</legend>
        <Field id="currency" label="Currency">
          {(control) => (
            <NativeSelect
              {...control}
              name="currency"
              defaultValue={client?.currency ?? "USD"}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field id="defaultTermsDays" label="Payment terms (days)">
          {(control) => (
            <Input
              {...control}
              name="defaultTermsDays"
              inputMode="numeric"
              defaultValue={String(client?.defaultTermsDays ?? 15)}
            />
          )}
        </Field>
        <Field id="taxId" label="Tax ID" optional>
          {(control) => (
            <Input {...control} name="taxId" defaultValue={client?.taxId} />
          )}
        </Field>
      </fieldset>

      <Field id="notes" label="Internal notes" optional>
        {(control) => (
          <Textarea
            {...control}
            name="notes"
            rows={3}
            defaultValue={client?.notes}
          />
        )}
      </Field>

      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {client ? "Save changes" : "Create client"}
      </Button>
    </form>
  )
}
