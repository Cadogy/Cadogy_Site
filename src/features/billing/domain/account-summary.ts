const invoices = (count: number) =>
  `${count} open ${count === 1 ? "invoice" : "invoices"}`

export const accountSummary = ({
  open,
  overdue,
}: {
  open: number
  overdue: number
}) => {
  if (open === 0) return "You're all paid up."
  if (overdue === 0) return `You have ${invoices(open)}.`
  return `You have ${invoices(open)}, ${overdue} overdue.`
}
