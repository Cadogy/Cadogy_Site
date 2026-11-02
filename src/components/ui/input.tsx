import * as React from "react"

import { cn } from "@/lib/utils"

export const fieldControlClass =
  "w-full rounded-field border border-input bg-background px-3.5 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      fieldControlClass,
      "h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium",
      className
    )}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
