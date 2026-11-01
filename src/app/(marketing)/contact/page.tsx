import type { Metadata } from "next"
import { connection } from "next/server"
import { ContactForm } from "@/features/contact/components/contact-form"
import { freshFormToken } from "@/features/contact/server/form-token"
import { Mail } from "lucide-react"

import { env } from "@/env"
import { siteConfig } from "@/config/site"
import { breadcrumbSchema } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Tell us what you're building. You'll hear back directly from one of Cadogy's founders.",
  alternates: { canonical: "/contact" },
}

const steps = [
  "We read every message ourselves and reply personally.",
  "If it's a fit, we set up a short call to understand your goals.",
  "You get a written proposal with scope, timeline and cost.",
] as const

export default async function ContactPage() {
  await connection()

  return (
    <div className="container-page grid gap-14 pt-20 pb-24 md:pt-28 lg:grid-cols-12 lg:gap-16 xl:pt-36">
      <JsonLd
        data={breadcrumbSchema([{ name: "Contact", path: "/contact" }])}
      />
      <header className="lg:col-span-5">
        <p className="text-meta">Contact</p>
        <h1 className="mt-5 text-h1">
          Tell us what you&apos;re{" "}
          <span className="serif-accent">building.</span>
        </h1>
        <p className="mt-5 text-lead">
          Share a few details and one of the founders will get back to you. No
          sales team, no gatekeeping.
        </p>
        <ol className="mt-10 grid gap-5 border-t pt-8">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="font-serif text-2xl leading-none text-muted-foreground italic">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 border-t pt-6">
          <p className="text-sm text-muted-foreground">Prefer email?</p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="mt-1 inline-flex min-h-11 items-center gap-2 font-medium underline-offset-4 hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            {siteConfig.email}
          </a>
        </div>
      </header>
      <section
        aria-label="Project inquiry form"
        className="lg:col-span-7 lg:pt-2"
      >
        <ContactForm
          formToken={freshFormToken()}
          turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </section>
    </div>
  )
}
