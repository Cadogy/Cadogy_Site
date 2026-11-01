import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import type { CatalogItem } from "../application/engine-ports"
import { intervalLabel } from "../domain/format"
import { BILLING_INTERVALS, type BillingInterval } from "../domain/recurring"
import { CURRENCIES } from "../domain/schema"

const toPriceInput = (minorUnits: number | undefined) =>
  minorUnits === undefined ? undefined : (minorUnits / 100).toFixed(2)

export function PriceField({
  id,
  defaultValue,
  optional,
}: {
  id: string
  defaultValue?: number
  optional?: boolean
}) {
  return (
    <Field id={id} label="Price" optional={optional} hint="Per unit, e.g. 8.00">
      {(control) => (
        <Input
          {...control}
          name="price"
          inputMode="decimal"
          defaultValue={toPriceInput(defaultValue)}
          required={!optional}
        />
      )}
    </Field>
  )
}

export function IntervalField({
  id,
  defaultValue,
  optional,
}: {
  id: string
  defaultValue?: BillingInterval
  optional?: boolean
}) {
  return (
    <Field id={id} label="Billing" optional={optional}>
      {(control) => (
        <NativeSelect
          {...control}
          name="interval"
          defaultValue={defaultValue ?? (optional ? "" : "month")}
        >
          {optional ? <option value="">From catalog</option> : null}
          {BILLING_INTERVALS.map((interval) => (
            <option key={interval} value={interval}>
              {intervalLabel(interval)}
            </option>
          ))}
        </NativeSelect>
      )}
    </Field>
  )
}

export function CatalogItemFields({ item }: { item?: CatalogItem }) {
  const prefix = item ? `catalog-${item.id}` : "catalog-new"
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id={`${prefix}-name`} label="Service name">
        {(control) => (
          <Input {...control} name="name" defaultValue={item?.name} required />
        )}
      </Field>
      <Field id={`${prefix}-description`} label="Description" optional>
        {(control) => (
          <Input
            {...control}
            name="description"
            defaultValue={item?.description}
          />
        )}
      </Field>
      <PriceField id={`${prefix}-price`} defaultValue={item?.unitAmount} />
      <div className="grid grid-cols-2 gap-5">
        <IntervalField
          id={`${prefix}-interval`}
          defaultValue={item?.interval}
        />
        <Field id={`${prefix}-currency`} label="Currency">
          {(control) => (
            <NativeSelect
              {...control}
              name="currency"
              defaultValue={item?.currency ?? "USD"}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>
    </div>
  )
}
