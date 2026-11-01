export function PageHeader({
  label,
  title,
  accent,
  lead,
  children,
}: {
  label: string
  title: string
  accent?: string
  lead: string
  children?: React.ReactNode
}) {
  return (
    <header className="container-page pt-20 pb-16 md:pt-28 md:pb-20 xl:pt-36">
      <p className="text-meta">{label}</p>
      <h1 className="mt-5 max-w-5xl text-h1">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="serif-accent">{accent}</span>
          </>
        ) : null}
      </h1>
      <p className="mt-7 max-w-2xl text-lead">{lead}</p>
      {children}
    </header>
  )
}
