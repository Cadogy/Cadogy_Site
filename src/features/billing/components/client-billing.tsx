import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import type {
  CatalogItem,
  Charge,
  StoredAddOn,
} from "../application/engine-ports"
import type { BillingClient } from "../application/ports"
import { formatDate, formatMoney, intervalLabel } from "../domain/format"
import {
  addAddOnAction,
  addChargeAction,
  invoiceChargesAction,
  removeCardAction,
  setAddOnStatusAction,
  setAutoBillAction,
  updateAddOnAction,
  voidChargeAction,
} from "../server/engine-actions"
import { ActionButton, ActionForm } from "./action-controls"
import { PendingCharges } from "./pending-charges"
import { IntervalField, PriceField } from "./service-fields"

const STATUS_LABELS: Record<StoredAddOn["status"], string> = {
  active: "Active",
  paused: "Paused",
  canceled: "Canceled",
  completed: "Billed",
}

const today = () => new Date().toISOString().slice(0, 10)

function AddOnRow({
  clientId,
  addOn,
}: {
  clientId: string
  addOn: StoredAddOn
}) {
  const live = addOn.status === "active" || addOn.status === "paused"
  return (
    <li className="grid gap-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="font-medium">
            {addOn.name}
            {addOn.quantity > 1 ? (
              <span className="text-muted-foreground"> × {addOn.quantity}</span>
            ) : null}
          </p>
          <p className="text-sm text-muted-foreground">
            {STATUS_LABELS[addOn.status]}
            {addOn.status === "active" && addOn.interval !== "one_time"
              ? ` · renews ${formatDate(addOn.nextBillingDate)}`
              : null}
            {addOn.status === "active" && addOn.interval === "one_time"
              ? ` · bills ${formatDate(addOn.nextBillingDate)}`
              : null}
          </p>
        </div>
        <p className="tabular-nums">
          {formatMoney(addOn.unitAmount * addOn.quantity, addOn.currency)}{" "}
          <span className="text-muted-foreground">
            {intervalLabel(addOn.interval, "per")}
          </span>
        </p>
      </div>
      {live ? (
        <div className="flex flex-wrap gap-2">
          {addOn.status === "active" ? (
            <ActionButton
              action={setAddOnStatusAction.bind(
                null,
                clientId,
                addOn.id,
                "paused"
              )}
              variant="ghost"
            >
              Pause
            </ActionButton>
          ) : (
            <ActionButton
              action={setAddOnStatusAction.bind(
                null,
                clientId,
                addOn.id,
                "active"
              )}
              variant="ghost"
            >
              Resume
            </ActionButton>
          )}
          <ActionButton
            action={setAddOnStatusAction.bind(
              null,
              clientId,
              addOn.id,
              "canceled"
            )}
            variant="ghost"
            confirm={`Cancel ${addOn.name}? Periods already billed stay billed; nothing further is charged.`}
          >
            Cancel
          </ActionButton>
          <details className="w-full">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
              Change quantity or price
            </summary>
            <div className="pt-4">
              <ActionForm
                action={updateAddOnAction.bind(null, clientId, addOn.id)}
                submitLabel="Update service"
                resetOnSuccess={false}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id={`quantity-${addOn.id}`} label="Quantity">
                    {(control) => (
                      <Input
                        {...control}
                        name="quantity"
                        type="number"
                        min={1}
                        defaultValue={addOn.quantity}
                      />
                    )}
                  </Field>
                  <PriceField
                    id={`price-${addOn.id}`}
                    defaultValue={addOn.unitAmount}
                  />
                </div>
              </ActionForm>
            </div>
          </details>
        </div>
      ) : null}
    </li>
  )
}

export function ClientBilling({
  client,
  addOns,
  pending,
  catalog,
}: {
  client: BillingClient
  addOns: readonly StoredAddOn[]
  pending: readonly Charge[]
  catalog: readonly CatalogItem[]
}) {
  const current = addOns.filter(
    (addOn) => addOn.status === "active" || addOn.status === "paused"
  )
  const past = addOns.filter(
    (addOn) => addOn.status === "canceled" || addOn.status === "completed"
  )
  const card = client.autopay.card

  return (
    <>
      <section aria-labelledby="client-services">
        <h2 id="client-services" className="mb-4 font-semibold">
          Services
        </h2>
        {current.length === 0 ? (
          <p className="border-t py-6 text-muted-foreground">
            No services yet.
          </p>
        ) : (
          <ul className="divide-y border-y">
            {current.map((addOn) => (
              <AddOnRow key={addOn.id} clientId={client.id} addOn={addOn} />
            ))}
          </ul>
        )}
        {past.length > 0 ? (
          <details className="mt-2">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
              Past services ({past.length})
            </summary>
            <ul className="divide-y border-y">
              {past.map((addOn) => (
                <AddOnRow key={addOn.id} clientId={client.id} addOn={addOn} />
              ))}
            </ul>
          </details>
        ) : null}

        <div className="mt-8 grid gap-4">
          <h3 className="font-medium">Add a service</h3>
          <ActionForm
            action={addAddOnAction.bind(null, client.id)}
            submitLabel="Add service"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="addon-catalog"
                label="From your catalog"
                optional
                hint="Or leave empty and fill in a custom service."
              >
                {(control) => (
                  <NativeSelect
                    {...control}
                    name="catalogItemId"
                    defaultValue=""
                  >
                    <option value="">Custom service</option>
                    {catalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} —{" "}
                        {formatMoney(item.unitAmount, item.currency)}{" "}
                        {intervalLabel(item.interval, "per")}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <Field
                id="addon-name"
                label="Name"
                optional
                hint="Overrides the catalog name."
              >
                {(control) => <Input {...control} name="name" />}
              </Field>
              <PriceField id="addon-price" optional />
              <IntervalField id="addon-interval" optional />
              <Field
                id="addon-quantity"
                label="Quantity"
                hint="Seats, mailboxes, domains…"
              >
                {(control) => (
                  <Input
                    {...control}
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                  />
                )}
              </Field>
              <Field
                id="addon-start"
                label="Start date"
                hint="The first period bills on this date. Renewals follow on the same day."
              >
                {(control) => (
                  <Input
                    {...control}
                    name="startDate"
                    type="date"
                    defaultValue={today()}
                  />
                )}
              </Field>
            </div>
          </ActionForm>
        </div>
      </section>

      <section aria-labelledby="client-pending" className="border-t pt-8">
        <h2 id="client-pending" className="mb-1 font-semibold">
          Waiting to be billed
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {client.autoBill
            ? "These go out together on the next automatic invoice. Bill now to send them sooner, or select some to invoice separately."
            : "Automatic billing is off for this client. Select what to invoice, or bill everything on one invoice."}
        </p>
        <PendingCharges
          charges={pending.map((charge) => ({
            id: charge.id,
            description: charge.description,
            amountLabel: formatMoney(
              charge.unitAmount * charge.quantity,
              charge.currency
            ),
          }))}
          onBill={invoiceChargesAction.bind(null, client.id)}
          onRemove={voidChargeAction.bind(null, client.id)}
        />
        <div className="mt-8 grid gap-4">
          <h3 className="font-medium">Add a one-off charge</h3>
          <ActionForm
            action={addChargeAction.bind(null, client.id)}
            submitLabel="Add charge"
          >
            <div className="grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
              <Field id="charge-description" label="Description">
                {(control) => (
                  <Input {...control} name="description" required />
                )}
              </Field>
              <PriceField id="charge-price" />
              <Field id="charge-quantity" label="Quantity">
                {(control) => (
                  <Input
                    {...control}
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                  />
                )}
              </Field>
            </div>
          </ActionForm>
        </div>
      </section>

      <section aria-labelledby="client-collection" className="border-t pt-8">
        <h2 id="client-collection" className="mb-4 font-semibold">
          Collection
        </h2>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <dt className="text-sm text-muted-foreground">Invoicing</dt>
            <dd>
              {client.autoBill
                ? "Automatic — renewals are invoiced and emailed."
                : "Manual — you bill pending charges."}
            </dd>
            <dd>
              <ActionButton
                action={setAutoBillAction.bind(
                  null,
                  client.id,
                  !client.autoBill
                )}
              >
                {client.autoBill ? "Switch to manual" : "Switch to automatic"}
              </ActionButton>
            </dd>
          </div>
          <div className="grid gap-2">
            <dt className="text-sm text-muted-foreground">Autopay</dt>
            <dd>
              {card
                ? `${client.autopay.enabled ? "On" : "Off"} · ${card.brand} ending ${card.last4}, expires ${card.expMonth}/${card.expYear}`
                : "No saved card. The client can save one from their billing page."}
            </dd>
            {card ? (
              <dd>
                <ActionButton
                  action={removeCardAction.bind(null, client.id)}
                  variant="ghost"
                  confirm="Remove the saved card and turn off autopay?"
                >
                  Remove card
                </ActionButton>
              </dd>
            ) : null}
          </div>
        </dl>
      </section>
    </>
  )
}
