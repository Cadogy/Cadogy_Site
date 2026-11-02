import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"

export type PolicySection = {
  readonly title: string
  readonly paragraphs?: readonly string[]
  readonly items?: readonly string[]
}

export function PolicyPage({
  title,
  path,
  effectiveDate,
  intro,
  sections,
}: {
  title: string
  path: string
  effectiveDate: string
  intro: string
  sections: readonly PolicySection[]
}) {
  return (
    <article className="container-page max-w-3xl pt-16 pb-20 sm:pt-24">
      <JsonLd data={breadcrumbSchema([{ name: title, path }])} />
      <header className="pb-10">
        <p className="text-meta">Policies</p>
        <h1 className="mt-4 text-h1">{title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Effective {effectiveDate}
        </p>
        <p className="mt-6 text-lead">{intro}</p>
      </header>
      <div className="grid gap-10 border-t pt-10">
        {sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`policy-${index}`}>
            <h2 id={`policy-${index}`} className="text-h3">
              {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
            {section.items ? (
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-muted-foreground marker:text-border">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  )
}
