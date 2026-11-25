import Image from "next/image"

import { siteConfig } from "@/config/site"

import { statement } from "../content"

const STAGES = ["Designed", "Reviewed", "Tested", "Shipped"] as const

export function Approach() {
  return (
    <section aria-label="Our approach" className="border-t section">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <p className="text-statement lg:col-span-8">
          <span className="read-in">{statement.lead}</span>
          {statement.sentences.map((sentence) => (
            <span key={sentence.key} className="read-in text-muted-foreground">
              {" "}
              {sentence.before}
              <span className="read-in-key">{sentence.key}</span>
              {sentence.after}
            </span>
          ))}
        </p>
        <div className="lg:col-span-4">
          <div className="flex -space-x-2">
            {siteConfig.founders.map((founder) => (
              <Image
                key={founder.name}
                src={founder.image}
                alt={founder.name}
                width={48}
                height={48}
                className="size-12 rounded-full border-2 border-background object-cover"
              />
            ))}
          </div>
          <ol className="mt-6 grid border-l">
            {STAGES.map((stage, index) => (
              <li
                key={stage}
                className="relative flex min-h-11 items-center pl-5 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -left-[5px] size-2.5 -translate-y-1/2 rounded-full border-2 border-background bg-brand"
                  style={{ opacity: 0.4 + index * 0.2 }}
                />
                {stage}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Every change, by one of the founders.
          </p>
        </div>
      </div>
    </section>
  )
}
