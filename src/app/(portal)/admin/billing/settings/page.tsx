import type { Metadata } from "next"
import {
  ActionButton,
  ActionForm,
} from "@/features/billing/components/action-controls"
import { formatDate } from "@/features/billing/domain/format"
import { billingEngine } from "@/features/billing/server/billing"
import {
  runBillingNowAction,
  saveBillingSettingsAction,
} from "@/features/billing/server/engine-actions"

import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PortalSection } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Billing settings" }

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
})

export default async function BillingSettingsPage() {
  const [settings, lastRun] = await Promise.all([
    billingEngine.getSettings(),
    billingEngine.lastRun(),
  ])

  return (
    <>
      <PortalPageHeader
        title="Billing settings"
        description="How renewals are invoiced, collected and followed up."
        actions={
          <ActionButton action={runBillingNowAction}>
            Run billing now
          </ActionButton>
        }
      />
      <div className="stack-sections">
        <PortalSection title="Last billing run">
          {lastRun ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {[
                [
                  "When",
                  `${formatDate(lastRun.at)}, ${timeFormatter.format(lastRun.at)} UTC`,
                ],
                ["Charges", lastRun.chargesCreated],
                ["Invoices", lastRun.invoicesIssued],
                ["Autopay collected", lastRun.autopayCollected],
                ["Autopay failed", lastRun.autopayFailed],
                ["Reminders", lastRun.remindersSent],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-meta">{label}</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">
              Billing hasn&apos;t run yet. It runs daily at 14:00 UTC, or use
              “Run billing now”.
            </p>
          )}
          {lastRun && lastRun.errors.length > 0 ? (
            <ul
              role="alert"
              className="mt-4 grid gap-1 text-sm text-destructive"
            >
              {lastRun.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </PortalSection>

        <PortalSection
          title="Defaults"
          description="Used for every automatic invoice. Each invoice keeps the values it was issued with."
          layout="split"
        >
          <ActionForm
            action={saveBillingSettingsAction}
            submitLabel="Save settings"
            resetOnSuccess={false}
          >
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                name="autoBillEnabled"
                defaultChecked={settings.autoBillEnabled}
                className="size-5 accent-foreground"
              />
              <span>
                Invoice renewals automatically
                <span className="block text-sm text-muted-foreground">
                  Due charges are combined into one invoice per client and
                  emailed. Turn off to review everything first.
                </span>
              </span>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="taxPercent"
                width="xs"
                label="Default tax rate (%)"
                hint="Applied to automatic invoices."
              >
                {(control) => (
                  <Input
                    {...control}
                    name="taxPercent"
                    inputMode="decimal"
                    defaultValue={(settings.defaultTaxRateBps / 100).toString()}
                  />
                )}
              </Field>
              <Field
                id="reminderOffsets"
                label="Reminder schedule (days from due date)"
                hint="Negative is before the due date. Example: -3, 0, 7, 14"
              >
                {(control) => (
                  <Input
                    {...control}
                    name="reminderOffsets"
                    defaultValue={settings.reminderOffsets.join(", ")}
                  />
                )}
              </Field>
            </div>
            <Field
              id="paymentInstructions"
              label="Payment instructions"
              optional
              hint="Shown on automatic invoices, e.g. bank transfer details."
            >
              {(control) => (
                <Textarea
                  {...control}
                  name="paymentInstructions"
                  rows={4}
                  defaultValue={settings.paymentInstructions}
                />
              )}
            </Field>
          </ActionForm>
        </PortalSection>
      </div>
    </>
  )
}
