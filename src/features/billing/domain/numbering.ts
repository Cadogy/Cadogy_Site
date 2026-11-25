const INVOICE_NUMBER_PREFIX = "CAD"
const CREDIT_NOTE_PREFIX = "CN"

const pad = (sequence: number) => String(sequence).padStart(4, "0")

type Numbered = { readonly year: number; readonly sequence: number }

export const invoiceCounterKey = (year: number) => `invoice-${year}`

export const formatInvoiceNumber = ({ year, sequence }: Numbered) =>
  `${INVOICE_NUMBER_PREFIX}-${year}-${pad(sequence)}`

export const creditNoteCounterKey = (year: number) => `credit-note-${year}`

export const formatCreditNoteNumber = ({ year, sequence }: Numbered) =>
  `${CREDIT_NOTE_PREFIX}-${year}-${pad(sequence)}`
