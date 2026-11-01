import Image from "next/image"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"

import { contactCta } from "../content"

export function CtaBand() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden"
    >
      <Image
        src="/images/studio/lighthouse.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 100vw, 230vw"
        quality={85}
        className="-z-10 object-cover object-[50%_62%] opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-background via-background/40 to-background"
      />
      <div className="container-page flex flex-col items-center py-32 text-center md:py-44">
        <h2 id="cta-title" className="max-w-4xl text-h1">
          {contactCta.title}
        </h2>
        <p className="mt-6 max-w-xl text-lead">{contactCta.body}</p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={contactCta.cta.href}>{contactCta.cta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
