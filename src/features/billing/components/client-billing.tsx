import { ActionButton, ActionForm } from "@/components/ui/action-controls"
import { EmptyState } from "@/components/ui/empty-state"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PortalSection } from "@/components/portal/portal-section"

import type { PlanAllowance } from "../application/engine"
import type {
  Charge,
  PricedCatalogItem,
  StoredAddOn,
  TimeEntry,
} from "../application/engine-ports"
import type { BillingClient } from "../application/ports"
import { catalogPriceLabel, groupByCategory } from "../domain/catalog"
import { isoDay } from "../domain/dates"
import {
  cardSummary,
  formatDate,
  formatMoney,
  intervalLabel,
} from "../domain/format"
import { formatHours } from "../domain/packages"
import {
  addAddOnAction,
  addChargeAction,
  invoiceChargesAction,
  removeCardAction,
  setAddOnStatusAction,
  setAutoBillAction,
  updateAddOnAction,
  updateChargeAction,
  voidChargeAction,
} from "../server/engine-actions"
import { ClientHours } from "./client-hours"
import { PendingCharges } from "./pending-charges"
import {
  IncludedHoursField,
  IntervalField,
  PriceField,
  QuantityField,
} from "./service-fields"
import { ServiceSummary } from "./service-summary"

const STATUS_LABELS: Record<StoredAddOn["status"], string> = {
  active: "Active",
  paused: "Paused",
  canceled: "Canceled",
  completed: "Billed",
}

const isLive = (addOn: StoredAddOn) =>
  addOn.status === "active" || addOn.status === "paused"

function AddOnRow({
  clientId,
  addOn,
  archived,
}: {
  clientId: string
  addOn: StoredAddOn
  archived: boolean
}) {
  return (
    <li className="grid gap-3 py-4">
      <ServiceSummary
        service={addOn}
        detail={
          <>
            {STATUS_LABELS[addOn.status]}
            {addOn.status === "active" && addOn.interval !== "one_time"
              ? ` · renews ${formatDate(addOn.nextBillingDate)}`
              : null}
            {addOn.status === "active" && addOn.interval === "one_time"
              ? ` · bills ${formatDate(addOn.nextBillingDate)}`
              : null}
            {addOn.includedHours && addOn.interval !== "one_time"
              ? ` · ${formatHours(addOn.includedHours * addOn.quantity)} of work included ${intervalLabel(addOn.interval, "per")}`
              : null}
          </>
        }
      />
      {isLive(addOn) && !archived ? (
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
              Edit service
            </summary>
            <div className="pt-4">
              <ActionForm
                action={updateAddOnAction.bind(null, clientId, addOn.id)}
                submitLabel="Update service"
                resetOnSuccess={false}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id={`name-${addOn.id}`} label="Name">
                    {(control) => (
                      <Input
                        {...control}
                        name="name"
                        defaultValue={addOn.name}
                        required
                      />
                    )}
                  </Field>
                  <IntervalField
                    id={`interval-${addOn.id}`}
                    defaultValue={addOn.interval}
                  />
                  <QuantityField
                    id={`quantity-${addOn.id}`}
                    defaultValue={addOn.quantity}
                  />
                  <PriceField
                    id={`price-${addOn.id}`}
                    defaultValue={addOn.unitAmount}
                  />
                  {addOn.interval !== "one_time" ? (
                    <IncludedHoursField
                      id={`hours-${addOn.id}`}
                      defaultValue={addOn.includedHours}
                      hint="Per unit, each billing period. Changes apply to time logged from now on."
                    />
                  ) : null}
                  <Field
                    id={`next-${addOn.id}`}
                    label={
                      addOn.interval === "one_time"
                        ? "Bills on"
                        : "Next billing date"
                    }
                    hint="Later renewals follow on the same day of the month."
                  >
                    {(control) => (
                      <Input
                        {...control}
                        name="nextBillingDate"
                        type="date"
                        min={isoDay(new Date())}
                        defaultValue={isoDay(addOn.nextBillingDate)}
                      />
                    )}
                  </Field>
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
  hours,
}: {
  client: BillingClient
  addOns: readonly StoredAddOn[]
  pending: readonly Charge[]
  catalog: readonly PricedCatalogItem[]
  hours: {
    readonly allowances: readonly PlanAllowance[]
    readonly entries: readonly TimeEntry[]
  }
}) {
  const current = addOns.filter(isLive)
  const past = addOns.filter((addOn) => !isLive(addOn))
  const card = client.autopay.card
  const archived = Boolean(client.archivedAt)

  return (
    <>
      {archived ? (
        <p
          role="status"
          className="rounded-field border px-4 py-3 text-sm text-muted-foreground"
        >
          This client is archived. Their services are paused and nothing is
          billed or reminded. Restore the client to make changes.
        </p>
      ) : null}
      <PortalSection title="Services">
        {current.length === 0 ? (
          <EmptyState>No services yet.</EmptyState>
        ) : (
          <ul className="rule-list">
            {current.map((addOn) => (
              <AddOnRow
                key={addOn.id}
                clientId={client.id}
                addOn={addOn}
                archived={archived}
              />
            ))}
          </ul>
        )}
        {past.length > 0 ? (
          <details className="mt-2">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
              Past services ({past.length})
            </summary>
            <ul className="rule-list">
              {past.map((addOn) => (
                <AddOnRow
                  key={addOn.id}
                  clientId={client.id}
                  addOn={addOn}
                  archived={archived}
                />
              ))}
            </ul>
          </details>
        ) : null}

        {archived ? null : (
          <div className="mt-10 grid max-w-3xl gap-4">
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
                      {groupByCategory(
                        catalog,
                        catalog.flatMap((item) =>
                          item.category ? [item.category] : []
                        )
                      ).map((group) => (
                        <optgroup
                          key={group.categoryId ?? "none"}
                          label={group.name}
                        >
                          {group.items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} — {catalogPriceLabel(item)}
                              {item.currency !== client.currency
                                ? ` (${item.currency})`
                                : ""}
                            </option>
                          ))}
                        </optgroup>
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
                <QuantityField
                  id="addon-quantity"
                  hint="Seats, mailboxes, domains…"
                />
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
                      defaultValue={isoDay(new Date())}
                    />
                  )}
                </Field>
              </div>
            </ActionForm>
          </div>
        )}
      </PortalSection>

      <ClientHours
        client={client}
        allowances={hours.allowances}
        entries={hours.entries}
        catalog={catalog}
      />

      <PortalSection
        title="Waiting to be billed"
        description={
          client.autoBill
            ? "These go out together on the next automatic invoice. Bill now to send them sooner, or select some to invoice separately."
            : "Automatic billing is off for this client. Select what to invoice, or bill everything on one invoice."
        }
      >
        <PendingCharges
          charges={pending.map((charge) => ({
            id: charge.id,
            description: charge.description,
            amountLabel: formatMoney(
              charge.unitAmount * charge.quantity,
              charge.currency
            ),
            quantity: charge.quantity,
            unitAmount: charge.unitAmount,
            hours: charge.unit === "hour",
            detail:
              charge.unit === "hour"
                ? `${formatHours(charge.quantity)} × ${formatMoney(charge.unitAmount, charge.currency)}`
                : charge.quantity > 1
                  ? `${charge.quantity} × ${formatMoney(charge.unitAmount, charge.currency)}`
                  : undefined,
          }))}
          onBill={invoiceChargesAction.bind(null, client.id)}
          onRemove={voidChargeAction.bind(null, client.id)}
          onUpdate={updateChargeAction.bind(null, client.id)}
          readOnly={archived}
        />
        {archived ? null : (
          <div className="mt-10 grid max-w-3xl gap-4">
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
                <QuantityField id="charge-quantity" />
              </div>
            </ActionForm>
          </div>
        )}
      </PortalSection>

      <PortalSection title="Collection">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <dt className="text-meta">Invoicing</dt>
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
            <dt className="text-meta">Autopay</dt>
            <dd>
              {card
                ? `${client.autopay.enabled ? "On" : "Off"} · ${cardSummary(card)}`
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
      </PortalSection>
    </>
  )
}
