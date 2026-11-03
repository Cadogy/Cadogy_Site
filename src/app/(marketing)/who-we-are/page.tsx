import type { Metadata } from "next"
import Image from "next/image"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { PageHeader } from "@/features/marketing/components/page-header"
import { PrinciplesGrid } from "@/features/marketing/components/principles-grid"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import { Mail } from "lucide-react"
import { FaLinkedin } from "react-icons/fa6"

import { siteConfig } from "@/config/site"
import { breadcrumbSchema, personSchema } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "About",
  description:
    "Cadogy was founded in 2020 by Charles Knapp and Dylan Safra: a small, senior software studio that designs, builds and runs production software.",
  alternates: { canonical: "/who-we-are" },
}

const stack = [
  "TypeScript",
  "Next.js",
  "React",
  "Node.js",
  "Express",
  "Tailwind CSS",
  "Python",
  "MongoDB",
  "MariaDB",
  "Redis",
  "Stripe",
  "Cloudflare",
  "Vercel",
  "AWS",
  "Google Cloud",
  "WordPress",
  "Shopify",
] as const

const iconLinkClass =
  "inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "About", path: "/who-we-are" }]),
          ...personSchema(),
        ]}
      />
      <PageHeader
        label="About"
        title="A small studio,"
        accent="by design."
        lead={`Cadogy was founded in ${siteConfig.foundingYear} by Charles Knapp and Dylan Safra. We stay small on purpose: a senior team with modern tooling and a disciplined process delivers the output of a much larger one, while you keep a direct line to the people doing the work.`}
      />

      <div className="container-page px-3 md:px-4">
        <div className="relative aspect-4/5 overflow-hidden rounded-media bg-card sm:aspect-16/8">
          <Image
            src="/images/studio/founders.webp"
            alt="Charles Knapp and Dylan Safra, Cadogy's founders"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
        </div>
      </div>

      <section
        aria-labelledby="story-title"
        className="container-page grid gap-10 section lg:grid-cols-12"
      >
        <h2 id="story-title" className="text-h2 lg:col-span-5">
          Learn daily. Build intentionally.{" "}
          <span className="serif-accent">Serve people well.</span>
        </h2>
        <div className="space-y-6 text-lead lg:col-span-6 lg:col-start-7">
          <p>
            Cadogy is the home for everything we build: client projects, our own
            products and the lessons we learn along the way. We treat every
            engagement as a chance to solve a problem properly, not just
            quickly.
          </p>
          <p>
            Modern tooling has changed how quickly good software can be built.
            We invest heavily in ours, so a small team can take on work that
            used to need a department. What hasn&apos;t changed is
            accountability: senior engineers make the decisions and stand behind
            every line that ships.
          </p>
        </div>
      </section>

      <section aria-labelledby="team-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="team-title"
            title="The people"
            accent="you'll work with."
          />
          <ul className="mt-14 grid gap-14 md:grid-cols-2 md:gap-10">
            {siteConfig.founders.map((founder) => (
              <li key={founder.name} className="border-t pt-8">
                <div className="flex items-center gap-5">
                  <Image
                    src={founder.image}
                    alt=""
                    width={80}
                    height={80}
                    className="size-16 rounded-full object-cover sm:size-20"
                  />
                  <div>
                    <h3 className="text-h3">{founder.name}</h3>
                    <p className="text-meta">{founder.role}</p>
                  </div>
                </div>
                <p className="mt-6 max-w-lg text-pretty text-muted-foreground">
                  {founder.bio}
                </p>
                <div className="mt-4 -ml-3 flex">
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${founder.name} on LinkedIn`}
                    className={iconLinkClass}
                  >
                    <FaLinkedin className="size-[18px]" aria-hidden="true" />
                  </a>
                  <a
                    href={`mailto:${founder.email}`}
                    aria-label={`Email ${founder.name}`}
                    className={iconLinkClass}
                  >
                    <Mail className="size-[18px]" aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="principles-title" className="border-t section">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <h2 id="principles-title" className="text-h2 lg:col-span-4">
            How we hold ourselves{" "}
            <span className="serif-accent">accountable.</span>
          </h2>
          <div className="lg:col-span-8">
            <PrinciplesGrid />
          </div>
        </div>
      </section>

      <section aria-labelledby="stack-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="stack-title"
            title="Tools we know"
            accent="deeply."
            lead="Proven technology for the foundation, modern tooling where it pays off."
          />
          <ul className="mt-10 flex flex-wrap gap-2">
            {stack.map((tech) => (
              <li
                key={tech}
                className="rounded-full bg-foreground/8 px-4 py-2 text-sm"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
