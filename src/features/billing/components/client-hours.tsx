import { ActionButton, ActionForm } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PortalSection } from "@/components/portal/portal-section"

import type { PlanAllowance } from "../application/engine"
import type { PricedCatalogItem, TimeEntry } from "../application/engine-ports"
import type { BillingClient } from "../application/ports"
import { catalogPriceLabel } from "../domain/catalog"
import { DAY_MS, isoDay } from "../domain/dates"
import { formatDate, formatMoney } from "../domain/format"
import { formatHours } from "../domain/packages"
import { logTimeAction, removeTimeEntryAction } from "../server/engine-actions"
import { PriceField } from "./service-fields"

export const periodLabel = (period: PlanAllowance["period"]) =>
  `${formatDate(period.start)} – ${formatDate(new Date(period.until.getTime() - DAY_MS))}`

function AllowanceMeter({ allowance }: { allowance: PlanAllowance }) {
  const share = allowance.allowance
    ? Math.min(1, allowance.used / allowance.allowance)
    : 0
  const over = allowance.remaining === 0
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="font-medium">{allowance.name}</p>
        <p className="text-sm tabular-nums">
          {formatHours(allowance.used)} of {formatHours(allowance.allowance)}{" "}
          used
        </p>
      </div>
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={over ? "h-full bg-warning" : "h-full bg-foreground"}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {periodLabel(allowance.period)} ·{" "}
        {over
          ? "All included hours used; more time is billed."
          : `${formatHours(allowance.remaining)} left this period`}
      </p>
    </div>
  )
}

const entryOutcome = (entry: TimeEntry) => {
  const billed =
    entry.billedHours > 0 && entry.unitAmount
      ? `${formatHours(entry.billedHours)} billed at ${formatMoney(entry.unitAmount, entry.currency)} / hour`
      : ""
  const covered =
    entry.includedHours > 0
      ? `${formatHours(entry.includedHours)} from plan hours`
      : ""
  return [covered, billed].filter(Boolean).join(" · ")
}

export function ClientHours({
  client,
  allowances,
  entries,
  catalog,
}: {
  client: BillingClient
  allowances: readonly PlanAllowance[]
  entries: readonly TimeEntry[]
  catalog: readonly PricedCatalogItem[]
}) {
  const archived = Boolean(client.archivedAt)
  if (archived && entries.length === 0) return null
  const hourly = catalog.filter(
    (item) => item.pricing === "hourly" && item.currency === client.currency
  )

  return (
    <PortalSection
      title="Hours"
      description={
        allowances.length > 0
          ? "Logged time comes out of the plan's included hours first. Anything beyond is added to the next invoice at the hourly rate."
          : "Logged time is added to the next invoice at the hourly rate. Give a service included hours to cover time in a plan."
      }
    >
      <div className="grid gap-10">
        {allowances.length > 0 ? (
          <div className="grid gap-6">
            {allowances.map((allowance) => (
              <AllowanceMeter key={allowance.addOnId} allowance={allowance} />
            ))}
          </div>
        ) : null}

        {archived ? null : (
          <div className="grid max-w-3xl gap-4">
            <h3 className="font-medium">Log time</h3>
            <ActionForm
              action={logTimeAction.bind(null, client.id)}
              submitLabel="Log time"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="time-description" label="What was done">
                  {(control) => (
                    <Input
                      {...control}
                      name="description"
                      required
                      maxLength={300}
                      placeholder="e.g. Updated the pricing page"
                    />
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-5">
                  <Field id="time-hours" label="Hours" hint="e.g. 1.5">
                    {(control) => (
                      <Input
                        {...control}
                        name="hours"
                        inputMode="decimal"
                        required
                      />
                    )}
                  </Field>
                  <Field id="time-date" label="Date">
                    {(control) => (
                      <Input
                        {...control}
                        name="date"
                        type="date"
                        max={isoDay(new Date())}
                        defaultValue={isoDay(new Date())}
                        required
                      />
                    )}
                  </Field>
                </div>
                <Field
                  id="time-service"
                  label="Service"
                  optional
                  hint="Sets the rate for any billed hours."
                >
                  {(control) => (
                    <NativeSelect
                      {...control}
                      name="catalogItemId"
                      defaultValue=""
                    >
                      <option value="">Default hourly rate</option>
                      {hourly.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {catalogPriceLabel(item)}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <PriceField
                  id="time-rate"
                  name="rate"
                  label="Rate"
                  optional
                  hint="Per hour. Overrides the service's rate."
                />
                {allowances.length > 0 ? (
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      name="billSeparately"
                      className="size-5 accent-foreground"
                    />
                    <span>
                      Bill all of it{" "}
                      <span className="text-muted-foreground">
                        · don&apos;t use plan hours, e.g. for emergency or
                        out-of-scope work
                      </span>
                    </span>
                  </label>
                ) : null}
              </div>
            </ActionForm>
          </div>
        )}

        {entries.length > 0 ? (
          <div className="grid gap-2">
            <h3 className="font-medium">Recent time</h3>
            <ul className="rule-list">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p>{entry.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(entry.date)} · {entryOutcome(entry)}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">
                    {formatHours(entry.hours)}
                  </p>
                  {archived ? null : (
                    <ActionButton
                      action={removeTimeEntryAction.bind(
                        null,
                        client.id,
                        entry.id
                      )}
                      variant="ghost"
                      confirm={`Remove ${formatHours(entry.hours)} for "${entry.description}"? Any billed hours still waiting to be invoiced are removed too.`}
                    >
                      Remove
                    </ActionButton>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </PortalSection>
  )
}
