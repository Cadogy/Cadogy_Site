import { Plus } from "lucide-react"

import { faqs } from "../content"

export function FaqList() {
  return (
    <div className="rule-list">
      {faqs.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-h3 [&::-webkit-details-marker]:hidden">
            <h3 className="text-h3">{faq.question}</h3>
            <Plus
              className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <p className="max-w-2xl pb-6 text-pretty text-muted-foreground">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  )
}
