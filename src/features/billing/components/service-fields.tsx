import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import type { CatalogCategory, CatalogItem } from "../application/engine-ports"
import { intervalLabel, toMoneyInput } from "../domain/format"
import { BILLING_INTERVALS, type BillingInterval } from "../domain/recurring"
import { CURRENCIES, type Currency } from "../domain/schema"
import { IncludedServicesPicker } from "./included-services-picker"

const UNIT_SUGGESTIONS_ID = "catalog-unit-suggestions"
const UNIT_SUGGESTIONS = [
  "page",
  "user",
  "mailbox",
  "template",
  "article",
  "product",
  "design",
  "domain",
  "website",
] as const

const toPriceInput = (minorUnits: number | null | undefined) =>
  minorUnits === undefined || minorUnits === null
    ? undefined
    : toMoneyInput(minorUnits)

export function PriceField({
  id,
  defaultValue,
  optional,
  required = !optional,
  name = "price",
  label = "Price",
  hint = "Per unit, e.g. 8.00",
}: {
  id: string
  defaultValue?: number | null
  optional?: boolean
  required?: boolean
  name?: string
  label?: string
  hint?: string
}) {
  return (
    <Field id={id} label={label} optional={optional} hint={hint}>
      {(control) => (
        <Input
          {...control}
          name={name}
          inputMode="decimal"
          defaultValue={toPriceInput(defaultValue)}
          required={required}
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

export function QuantityField({
  id,
  defaultValue = 1,
  hint,
  hours = false,
}: {
  id: string
  defaultValue?: number
  hint?: string
  /** Hours take quarter and half hours, e.g. 1.5. */
  hours?: boolean
}) {
  return (
    <Field id={id} label={hours ? "Hours" : "Quantity"} hint={hint}>
      {(control) => (
        <Input
          {...control}
          name="quantity"
          type="number"
          min={hours ? 0.01 : 1}
          step={hours ? 0.01 : 1}
          defaultValue={defaultValue}
        />
      )}
    </Field>
  )
}

/** Hours of work included each period; blank for none. */
export function IncludedHoursField({
  id,
  defaultValue,
  hint = "Hours of work included each billing period. Logged time beyond this is billed at the hourly rate.",
}: {
  id: string
  defaultValue?: number | null
  hint?: string
}) {
  return (
    <Field id={id} label="Included hours" optional hint={hint}>
      {(control) => (
        <Input
          {...control}
          name="includedHours"
          inputMode="decimal"
          defaultValue={defaultValue ?? undefined}
          placeholder="e.g. 3"
        />
      )}
    </Field>
  )
}

/** Common payment terms, offered as suggestions on any terms field. */
export const TERMS_SUGGESTIONS_ID = "payment-terms-suggestions"

export function PaymentTermsSuggestions() {
  return (
    <datalist id={TERMS_SUGGESTIONS_ID}>
      <option value="0">Due on receipt</option>
      <option value="7">Net 7</option>
      <option value="15">Net 15</option>
      <option value="30">Net 30</option>
      <option value="45">Net 45</option>
      <option value="60">Net 60</option>
    </datalist>
  )
}

export function CurrencyField({
  id,
  defaultValue = "USD",
}: {
  id: string
  defaultValue?: Currency
}) {
  return (
    <Field id={id} label="Currency">
      {(control) => (
        <NativeSelect {...control} name="currency" defaultValue={defaultValue}>
          {CURRENCIES.map((currency) => (
            <option key={currency}>{currency}</option>
          ))}
        </NativeSelect>
      )}
    </Field>
  )
}

export function CategoryFields({ category }: { category?: CatalogCategory }) {
  const prefix = category ? `category-${category.id}` : "category-new"
  return (
    <div className="grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
      <Field id={`${prefix}-name`} label="Category name">
        {(control) => (
          <Input
            {...control}
            name="name"
            defaultValue={category?.name}
            required
          />
        )}
      </Field>
      <PriceField
        id={`${prefix}-rate`}
        name="hourlyRate"
        label="Hourly rate"
        optional
        hint="Used by hourly services in this category."
        defaultValue={category?.hourlyRate?.amount}
      />
      <CurrencyField
        id={`${prefix}-currency`}
        defaultValue={category?.hourlyRate?.currency}
      />
    </div>
  )
}

export function CatalogItemFields({
  item,
  categories,
}: {
  item?: CatalogItem
  categories: readonly CatalogCategory[]
}) {
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
      <Field id={`${prefix}-category`} label="Category" optional>
        {(control) => (
          <NativeSelect
            {...control}
            name="categoryId"
            defaultValue={item?.categoryId ?? ""}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>
      <Field id={`${prefix}-pricing`} label="Pricing">
        {(control) => (
          <NativeSelect
            {...control}
            name="pricing"
            defaultValue={item?.pricing ?? "fixed"}
          >
            <option value="fixed">Fixed price</option>
            <option value="hourly">Hourly</option>
            <option value="at_cost">At cost (third-party expense)</option>
          </NativeSelect>
        )}
      </Field>
      <PriceField
        id={`${prefix}-price`}
        required={false}
        hint="Fixed: price per unit. Hourly: rate per hour, or empty to use the category or default rate. At cost: optional typical cost."
        defaultValue={item?.unitAmount}
      />
      <Field
        id={`${prefix}-unit`}
        label="Unit"
        optional
        hint="What one unit is, e.g. page, user or mailbox."
      >
        {(control) => (
          <Input
            {...control}
            name="unit"
            defaultValue={item?.unit ?? undefined}
            list={UNIT_SUGGESTIONS_ID}
            autoComplete="off"
          />
        )}
      </Field>
      <datalist id={UNIT_SUGGESTIONS_ID}>
        {UNIT_SUGGESTIONS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="priceFrom"
          defaultChecked={item?.priceFrom ?? false}
          className="size-5 accent-foreground"
        />
        <span>
          Starting price{" "}
          <span className="text-muted-foreground">
            · shown as “From $1,500” and adjusted per job
          </span>
        </span>
      </label>
      <div className="grid gap-5 border-t pt-5 sm:col-span-2 sm:grid-cols-2">
        <p className="text-sm text-muted-foreground sm:col-span-2">
          <span className="font-medium text-foreground">Package</span> ·
          Optional. Bundle other services and a monthly allowance of hours into
          this one, like a care plan.
        </p>
        <IncludedHoursField
          id={`${prefix}-included-hours`}
          defaultValue={item?.includedHours}
        />
        <IncludedServicesPicker
          selected={item?.includedItemIds ?? []}
          excludeId={item?.id}
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <IntervalField
          id={`${prefix}-interval`}
          defaultValue={item?.interval}
        />
        <CurrencyField
          id={`${prefix}-currency`}
          defaultValue={item?.currency}
        />
      </div>
    </div>
  )
}
