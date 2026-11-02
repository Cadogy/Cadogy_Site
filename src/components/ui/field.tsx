import * as React from "react"

import { cn } from "@/lib/utils"

import { Label } from "./label"

type ControlProps = {
  id: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

const WIDTHS = {
  full: "",
  md: "max-w-sm",
  sm: "max-w-60",
  xs: "max-w-36",
} as const

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  width = "full",
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  width?: keyof typeof WIDTHS
  className?: string
  children: (control: ControlProps) => React.ReactNode
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        ) : null}
      </Label>
      <div className={WIDTHS[width]}>
        {children({
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        })}
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
