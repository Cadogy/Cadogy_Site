import Link from "next/link"

import type { CreditNoteKind } from "../application/credits"
import { formatDate, formatMoney } from "../domain/format"
import type { Currency } from "../domain/schema"

const KIND_LABELS: Record<CreditNoteKind, string> = {
  refund: "Refund",
  invoice_credit: "Invoice credit",
  balance_credit: "Account credit",
}

type ListedNote = {
  readonly id: string
  readonly number: string
  readonly invoiceId: string | null
  readonly kind: CreditNoteKind
  readonly amount: number
  readonly currency: Currency
  readonly reason: string
  readonly createdAt: Date
}

export function CreditNoteList({
  notes,
  hrefFor,
}: {
  notes: readonly ListedNote[]
  hrefFor: (invoiceId: string) => string
}) {
  if (notes.length === 0)
    return <p className="text-sm text-muted-foreground">No credit notes yet.</p>

  return (
    <ul className="grid">
      {notes.map((note) => (
        <li
          key={note.id}
          aria-label={note.number}
          className="grid gap-1 border-t py-3 text-sm sm:grid-cols-[9rem_1fr_auto] sm:gap-4"
        >
          <span className="font-medium tabular-nums">{note.number}</span>
          <span className="text-muted-foreground">
            <span>{`${KIND_LABELS[note.kind]} · ${note.reason}`}</span>
            {note.invoiceId ? (
              <>
                {" "}
                <Link
                  href={hrefFor(note.invoiceId)}
                  className="underline underline-offset-4"
                >
                  View invoice
                </Link>
              </>
            ) : null}
            <span className="block">{formatDate(note.createdAt)}</span>
          </span>
          <span className="tabular-nums sm:text-right">
            {formatMoney(note.amount, note.currency)}
          </span>
        </li>
      ))}
    </ul>
  )
}
