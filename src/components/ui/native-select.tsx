import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { fieldControlClass } from "./input"

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(fieldControlClass, "h-11 appearance-none pr-10", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
  </div>
))
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
