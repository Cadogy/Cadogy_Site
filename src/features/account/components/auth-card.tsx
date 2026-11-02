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
    <div className="w-full max-w-sm">
      <h1 className="text-h2">{title}</h1>
      {description ? <p className="mt-3 text-lead">{description}</p> : null}
      <div className="mt-8">{children}</div>
      {footer ? (
        <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">
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
          ? "border-l-2 border-destructive py-1 pl-3 text-sm"
          : "border-l-2 border-success py-1 pl-3 text-sm"
      }
    >
      {children}
    </p>
  )
}
