import { processSteps } from "../content"

export function ProcessSteps() {
  return (
    <ol className="grid lg:grid-cols-3">
      {processSteps.map((step, index) => (
        <li
          key={step.title}
          className="border-t py-10 lg:border-l lg:px-8 lg:py-12 lg:first:border-l-0 lg:first:pl-0"
        >
          <span className="font-serif text-h1 font-normal text-muted-foreground italic">
            {index + 1}
          </span>
          <h3 className="mt-8 text-h3">{step.title}</h3>
          <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  )
}
