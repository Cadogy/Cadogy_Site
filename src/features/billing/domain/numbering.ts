const INVOICE_NUMBER_PREFIX = "CAD"

export const invoiceCounterKey = (year: number) => `invoice-${year}`

export const formatInvoiceNumber = ({
  year,
  sequence,
}: {
  year: number
  sequence: number
}) => `${INVOICE_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`
