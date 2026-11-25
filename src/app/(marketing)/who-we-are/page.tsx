import type { Metadata } from "next"
import Image from "next/image"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { FoundersStage } from "@/features/marketing/components/founders-stage"
import { PrinciplesGrid } from "@/features/marketing/components/principles-grid"
import { ProofFigures } from "@/features/marketing/components/proof-figures"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import { TagList } from "@/features/marketing/components/tag-list"
import { Mail } from "lucide-react"
import { FaLinkedin } from "react-icons/fa6"

import { siteConfig } from "@/config/site"
import { breadcrumbSchema, personSchema } from "@/lib/seo/structured-data"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/seo/json-ld"
import { OnThisPage } from "@/components/site/on-this-page"

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

const ABOUT_SECTIONS = [
  { id: "story", label: "Our story" },
  { id: "team", label: "The team" },
  { id: "principles", label: "Principles" },
  { id: "proof", label: "Proof" },
  { id: "stack", label: "Stack" },
] as const

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "About", path: "/who-we-are" }]),
          ...personSchema(),
        ]}
      />
      <div className="relative bg-background">
        <FoundersStage />
        <header className="relative container-page mt-10 pb-16 text-center md:-mt-24 md:pb-20">
          <p className="text-meta">About</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-h1">
            A small studio,{" "}
            <span className="text-muted-foreground">by design.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lead">
            Cadogy was founded in {siteConfig.foundingYear} by Charles Knapp and
            Dylan Safra. We stay small on purpose: a senior team with modern
            tooling and a disciplined process delivers the output of a much
            larger one, while you keep a direct line to the people doing the
            work.
          </p>
        </header>
      </div>

      <div className="border-t">
        <div className="container-page grid gap-12 section lg:grid-cols-12 lg:gap-16">
          <OnThisPage
            items={ABOUT_SECTIONS}
            className="hidden lg:sticky lg:top-24 lg:col-span-3 lg:block lg:self-start"
          />

          <div className="min-w-0 lg:col-span-9">
            <section
              id="story"
              aria-labelledby="story-title"
              className="scroll-mt-24"
            >
              <h2 id="story-title" className="text-h2">
                Learn daily. Build intentionally.{" "}
                <span className="text-muted-foreground">
                  Serve people well.
                </span>
              </h2>
              <div className="mt-6 max-w-3xl space-y-5 text-lead">
                <p>
                  Cadogy is the home for everything we build: client projects,
                  our own products and the lessons we learn along the way. We
                  treat every engagement as a chance to solve a problem
                  properly, not just quickly.
                </p>
                <p>
                  Modern tooling has changed how quickly good software can be
                  built. We invest heavily in ours, so a small team can take on
                  work that used to need a department. What hasn&apos;t changed
                  is accountability: senior engineers make the decisions and
                  stand behind every line that ships.
                </p>
              </div>
            </section>

            <section
              id="team"
              aria-labelledby="team-title"
              className="mt-20 scroll-mt-24 border-t pt-12"
            >
              <SectionHeading
                tick={false}
                id="team-title"
                title="The people"
                accent="you'll work with."
              />
              <ul className="mt-10 grid gap-10 md:grid-cols-2">
                {siteConfig.founders.map((founder) => (
                  <li key={founder.name}>
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
                      <Button asChild variant="quiet" size="icon">
                        <a
                          href={founder.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${founder.name} on LinkedIn`}
                        >
                          <FaLinkedin
                            className="size-[18px]"
                            aria-hidden="true"
                          />
                        </a>
                      </Button>
                      <Button asChild variant="quiet" size="icon">
                        <a
                          href={`mailto:${founder.email}`}
                          aria-label={`Email ${founder.name}`}
                        >
                          <Mail className="size-[18px]" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section
              id="principles"
              aria-labelledby="principles-title"
              className="mt-20 scroll-mt-24 border-t pt-12"
            >
              <SectionHeading
                tick={false}
                id="principles-title"
                title="How we hold ourselves"
                accent="accountable."
              />
              <div className="mt-10">
                <PrinciplesGrid />
              </div>
            </section>

            <section
              id="proof"
              aria-labelledby="proof-title"
              className="mt-20 scroll-mt-24 border-t pt-12"
            >
              <SectionHeading
                tick={false}
                id="proof-title"
                title="Numbers we can show you."
                lead="Counted from the code of products we built and run. Each one links to the case study it comes from."
              />
              <div className="mt-10">
                <ProofFigures />
              </div>
            </section>

            <section
              id="stack"
              aria-labelledby="stack-title"
              className="mt-20 scroll-mt-24 border-t pt-12"
            >
              <SectionHeading
                tick={false}
                id="stack-title"
                title="Tools we know"
                accent="deeply."
                lead="Proven technology for the foundation, modern tooling where it pays off."
              />
              <TagList items={stack} className="mt-8" />
            </section>
          </div>
        </div>
      </div>

      <CtaBand />
    </>
  )
}
