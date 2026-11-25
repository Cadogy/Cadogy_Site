import { useId } from "react"

import { cn } from "@/lib/utils"

type Option = {
  readonly id: string
  readonly title: string
  readonly note?: string
}

type Row = {
  readonly topic: string
  readonly values: readonly string[]
}

export function ComparisonTable({
  caption,
  options,
  rows,
  highlight,
}: {
  caption: string
  options: readonly Option[]
  rows: readonly Row[]
  highlight?: string
}) {
  const id = useId()
  const highlighted = (index: number) => options[index]?.id === highlight
  const lastRow = rows.length - 1

  return (
    <>
      <table className="hidden w-full table-fixed border-separate border-spacing-0 text-left lg:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-1/5 pb-5 font-normal">
              <span className="sr-only">Topic</span>
            </th>
            {options.map((option, index) => (
              <th
                key={option.id}
                scope="col"
                className={cn(
                  "px-6 pt-6 pb-5 align-bottom font-medium",
                  highlighted(index) && "rounded-t-media bg-card"
                )}
              >
                <span className="block text-h3">{option.title}</span>
                {option.note ? (
                  <span className="mt-1 block text-meta">{option.note}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.topic} className="align-top">
              <th
                scope="row"
                className="border-t py-5 pr-6 font-medium text-muted-foreground"
              >
                {row.topic}
              </th>
              {row.values.map((value, index) => (
                <td
                  key={options[index]?.id ?? index}
                  className={cn(
                    "border-t px-6 py-5 text-pretty",
                    highlighted(index) && "bg-card",
                    highlighted(index) &&
                      rowIndex === lastRow &&
                      "rounded-b-media"
                  )}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-12 lg:hidden">
        {options.map((option, index) => (
          <div
            key={option.id}
            role="group"
            aria-labelledby={`${id}-${option.id}`}
          >
            <h3 id={`${id}-${option.id}`} className="text-h3">
              {option.title}
            </h3>
            {option.note ? (
              <p className="mt-1 text-meta">{option.note}</p>
            ) : null}
            <dl className="mt-5 rule-list">
              {rows.map((row) => (
                <div key={row.topic} className="grid gap-1 py-4">
                  <dt className="text-sm text-muted-foreground">{row.topic}</dt>
                  <dd className="text-pretty">{row.values[index]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  )
}
