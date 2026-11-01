import type { Invoice } from "./invoice"
import type { Currency, LineItem } from "./schema"
import { calculateInvoiceTotals } from "./totals"

const DAY_MS = 86_400_000

export type PendingChargeLine = {
  readonly id: string
  readonly clientId: string
  readonly description: string
  readonly quantity: number
  readonly unitAmount: number
  readonly currency: Currency
}

export type ChargeGroup = {
  readonly clientId: string
  readonly currency: Currency
  readonly chargeIds: readonly string[]
  readonly lineItems: readonly LineItem[]
}

export const consolidateCharges = (
  charges: readonly PendingChargeLine[]
): ChargeGroup[] =>
  charges.reduce<ChargeGroup[]>((groups, charge) => {
    const line = {
      description: charge.description,
      quantity: charge.quantity,
      unitAmount: charge.unitAmount,
    }
    const index = groups.findIndex(
      (group) =>
        group.clientId === charge.clientId && group.currency === charge.currency
    )
    if (index === -1) {
      return [
        ...groups,
        {
          clientId: charge.clientId,
          currency: charge.currency,
          chargeIds: [charge.id],
          lineItems: [line],
        },
      ]
    }
    return groups.map((group, i) =>
      i === index
        ? {
            ...group,
            chargeIds: [...group.chargeIds, charge.id],
            lineItems: [...group.lineItems, line],
          }
        : group
    )
  }, [])

export type Allocation = { readonly invoiceId: string; readonly amount: number }

const dueTime = (invoice: Invoice) =>
  invoice.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER

export const allocatePayment = (invoices: readonly Invoice[], amount: number) =>
  [...invoices]
    .sort((a, b) => dueTime(a) - dueTime(b))
    .reduce<{ allocations: Allocation[]; unallocated: number }>(
      (acc, invoice) => {
        const owed = calculateInvoiceTotals(invoice).amountDue
        const applied = Math.min(owed, acc.unallocated)
        if (applied <= 0) return acc
        return {
          allocations: [
            ...acc.allocations,
            { invoiceId: invoice.id, amount: applied },
          ],
          unallocated: acc.unallocated - applied,
        }
      },
      { allocations: [], unallocated: amount }
    )

export const reminderKey = (offset: number) => `offset:${offset}`

export const dueReminders = (
  invoice: Invoice,
  today: Date,
  offsets: readonly number[]
): number[] => {
  if (invoice.status !== "open" || !invoice.dueDate) return []
  const sent = new Set(
    invoice.events
      .filter((event) => event.type === "reminder_sent")
      .map((event) => event.detail)
  )
  const due = invoice.dueDate.getTime()
  const reached = [...offsets]
    .sort((a, b) => a - b)
    .filter((offset) => due + offset * DAY_MS <= today.getTime())
  const latest = reached.at(-1)
  return latest === undefined || sent.has(reminderKey(latest)) ? [] : [latest]
}
