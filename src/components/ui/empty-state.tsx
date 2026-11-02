export function EmptyState({
  action,
  children,
}: {
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">{children}</p>
      {action}
    </div>
  )
}
