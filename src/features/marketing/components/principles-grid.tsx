import { principles } from "../content"

export function PrinciplesGrid() {
  return (
    <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
      {principles.map((principle) => (
        <div key={principle.title}>
          <dt className="text-h3">{principle.title}</dt>
          <dd className="mt-3 max-w-md text-pretty text-muted-foreground">
            {principle.body}
          </dd>
        </div>
      ))}
    </dl>
  )
}
