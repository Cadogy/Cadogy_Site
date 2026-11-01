import * as React from "react"

import { cn } from "@/lib/utils"

import { fieldControlClass } from "./input"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldControlClass, "min-h-32 py-2.5", className)}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
