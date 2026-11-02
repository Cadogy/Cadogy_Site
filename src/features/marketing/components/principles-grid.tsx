import { principles } from "../content"

export function PrinciplesGrid() {
  return (
    <dl className="grid sm:grid-cols-2">
      {principles.map((principle) => (
        <div
          key={principle.title}
          className="border-t py-8 sm:odd:pr-10 sm:even:border-l sm:even:pl-10"
        >
          <dt className="text-h3">{principle.title}</dt>
          <dd className="mt-3 max-w-md text-pretty text-muted-foreground">
            {principle.body}
          </dd>
        </div>
      ))}
    </dl>
  )
}
