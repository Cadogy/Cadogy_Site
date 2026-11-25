import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const pagesToShow = (page: number, totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1
  )

const step =
  "inline-flex size-11 items-center justify-center rounded-control text-sm transition-colors"

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
}) {
  const shown = pagesToShow(page, totalPages)
  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-center gap-1"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className={cn(step, "text-muted-foreground hover:text-foreground")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {shown.map((target, index) => (
        <span key={target} className="contents">
          {index > 0 && target - (shown[index - 1] ?? target) > 1 ? (
            <span
              aria-hidden="true"
              className={cn(step, "text-muted-foreground")}
            >
              …
            </span>
          ) : null}
          <Link
            href={hrefFor(target)}
            aria-label={`Page ${target}`}
            aria-current={target === page ? "page" : undefined}
            className={cn(
              step,
              "tabular-nums",
              target === page
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {target}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          aria-label="Next page"
          className={cn(
            step,
            "w-auto gap-1 px-3 text-muted-foreground hover:text-foreground"
          )}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  )
}
