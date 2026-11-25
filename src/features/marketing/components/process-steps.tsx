import Image from "next/image"

import { processSteps } from "../content"

export function ProcessSteps({
  withExamples = false,
}: {
  withExamples?: boolean
}) {
  return (
    <ol aria-label="Our process" className="grid lg:-mx-8 lg:grid-cols-3">
      {processSteps.map((step, index) => (
        <li
          key={step.title}
          className="border-t py-10 lg:border-t-0 lg:border-l lg:px-8 lg:py-4 lg:first:border-l-0"
        >
          <span className="text-h1 text-muted-foreground">{index + 1}</span>
          <h3 className="mt-8 text-h3">{step.title}</h3>
          <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
            {step.body}
          </p>
          {withExamples ? (
            <div className="relative isolate mt-8 aspect-15/8 transform-gpu overflow-hidden rounded-media border bg-card">
              <Image
                src={step.example.image}
                alt={step.example.alt}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                quality={85}
                className="object-cover object-top"
              />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
