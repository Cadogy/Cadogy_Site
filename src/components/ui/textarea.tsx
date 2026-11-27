import * as React from "react"

import { cn } from "@/lib/utils"

import { fieldControlClass } from "./input"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    // Grows with what's typed (where supported) instead of scrolling inside a
    // small box; capped so a long message never pushes the submit button away.
    className={cn(
      fieldControlClass,
      "[field-sizing:content] max-h-[60vh] min-h-32 resize-y py-2.5",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
