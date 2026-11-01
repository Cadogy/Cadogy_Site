export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <h1 className="text-h3 text-2xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success"
  children: React.ReactNode
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm"
          : "rounded-md border border-success/40 bg-success/10 px-3 py-2.5 text-sm"
      }
    >
      {children}
    </p>
  )
}
