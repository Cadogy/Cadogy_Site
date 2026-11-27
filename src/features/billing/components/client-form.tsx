"use client"

import { ActionMessage, useFormAction } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PendingButton } from "@/components/ui/pending-button"
import { Textarea } from "@/components/ui/textarea"

import type { BillingClient } from "../application/ports"
import { saveClientAction } from "../server/actions"
import {
  CurrencyField,
  PaymentTermsSuggestions,
  TERMS_SUGGESTIONS_ID,
} from "./service-fields"

export function ClientForm({ client }: { client: BillingClient | null }) {
  const { state, pending, onSubmit } = useFormAction(
    saveClientAction.bind(null, client?.id ?? null)
  )

  return (
    <form onSubmit={onSubmit} className="grid gap-10">
      <ActionMessage state={state} />
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
        <legend className="mb-4 font-medium">Address</legend>
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
        <legend className="mb-4 font-medium">Billing defaults</legend>
        <CurrencyField id="currency" defaultValue={client?.currency} />
        <Field id="defaultTermsDays" label="Payment terms (days)">
          {(control) => (
            <Input
              {...control}
              name="defaultTermsDays"
              inputMode="numeric"
              list={TERMS_SUGGESTIONS_ID}
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

      <PaymentTermsSuggestions />
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

      <PendingButton
        type="submit"
        pending={pending}
        className="justify-self-start"
      >
        {client ? "Save changes" : "Create client"}
      </PendingButton>
    </form>
  )
}
