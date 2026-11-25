import { cn } from "@/lib/utils"

export function TagList({
  items,
  className,
}: {
  items: readonly string[]
  className?: string
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-foreground/8 px-4 py-2 text-sm"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}
