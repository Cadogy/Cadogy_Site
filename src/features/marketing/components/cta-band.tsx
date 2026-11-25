import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"

import { contactCta } from "../content"
import { HeadingTick } from "./heading-tick"

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="border-t section-tight">
      <div className="container-page flex flex-col justify-between gap-8 md:flex-row md:items-center">
        <h2 id="cta-title" className="relative max-w-2xl text-h2">
          <HeadingTick />
          {contactCta.title}{" "}
          <span className="text-muted-foreground">{contactCta.body}</span>
        </h2>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={contactCta.cta.href}>
              {contactCta.cta.label}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
