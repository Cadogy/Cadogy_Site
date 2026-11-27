import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import type { CatalogCategory, CatalogItem } from "../application/engine-ports"
import { intervalLabel, toMoneyInput } from "../domain/format"
import { BILLING_INTERVALS, type BillingInterval } from "../domain/recurring"
import { CURRENCIES, type Currency } from "../domain/schema"

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
}: {
  id: string
  defaultValue?: number
  hint?: string
}) {
  return (
    <Field id={id} label="Quantity" hint={hint}>
      {(control) => (
        <Input
          {...control}
          name="quantity"
          type="number"
          min={1}
          defaultValue={defaultValue}
        />
      )}
    </Field>
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
          </NativeSelect>
        )}
      </Field>
      <PriceField
        id={`${prefix}-price`}
        required={false}
        hint="Fixed: price per unit. Hourly: rate per hour — leave empty to use the category or default rate."
        defaultValue={item?.unitAmount}
      />
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
