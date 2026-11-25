import Link from "next/link"

import { EmptyState } from "@/components/ui/empty-state"

import type { CreditNote } from "../application/credits"
import { formatDate, formatMoney } from "../domain/format"
import type { CreditNoteKind } from "../domain/invoice"

const KIND_LABELS: Record<CreditNoteKind, string> = {
  refund: "Refund",
  invoice_credit: "Invoice credit",
  balance_credit: "Account credit",
}

type ListedNote = Pick<
  CreditNote,
  | "id"
  | "number"
  | "invoiceId"
  | "kind"
  | "amount"
  | "currency"
  | "reason"
  | "createdAt"
>

export function CreditNoteList({
  notes,
  hrefFor,
}: {
  notes: readonly ListedNote[]
  hrefFor: (invoiceId: string) => string
}) {
  if (notes.length === 0) return <EmptyState>No credit notes yet.</EmptyState>

  return (
    <ul className="rule-list">
      {notes.map((note) => (
        <li
          key={note.id}
          aria-label={note.number}
          className="grid gap-1 py-3 text-sm sm:grid-cols-[9rem_1fr_auto] sm:gap-4"
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
