import { cn } from "@/lib/utils"

export function SectionHeading({
  id,
  title,
  accent,
  lead,
  action,
  className,
}: {
  id: string
  title: string
  accent?: string
  lead?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-6 md:flex-row md:items-end",
        className
      )}
    >
      <div className="max-w-3xl">
        <h2 id={id} className="text-h2">
          {title}
          {accent ? (
            <>
              {" "}
              <span className="serif-accent">{accent}</span>
            </>
          ) : null}
        </h2>
        {lead ? <p className="mt-5 max-w-2xl text-lead">{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
