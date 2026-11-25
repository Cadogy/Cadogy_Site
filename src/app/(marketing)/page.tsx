import type { Metadata } from "next"
import Link from "next/link"
import { Approach } from "@/features/marketing/components/approach"
import { ArrowLink } from "@/features/marketing/components/arrow-link"
import { ArticleRail } from "@/features/marketing/components/article-rail"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { FaqList } from "@/features/marketing/components/faq-list"
import { HeadingTick } from "@/features/marketing/components/heading-tick"
import { HeroStage } from "@/features/marketing/components/hero-stage"
import { ProcessSteps } from "@/features/marketing/components/process-steps"
import { ProofStrip } from "@/features/marketing/components/proof-strip"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import { ServicesBento } from "@/features/marketing/components/services-bento"
import { StoryCarousel } from "@/features/marketing/components/story-carousel"
import { caseStudies, hero } from "@/features/marketing/content"
import { ChevronRight } from "lucide-react"

import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/seo/page-metadata"
import { faqSchema, websiteSchema } from "@/lib/seo/structured-data"
import { getLatestPosts } from "@/lib/wordpress-api"
import { Button } from "@/components/ui/button"
import { TextLink } from "@/components/ui/text-link"
import { SignalGrid } from "@/components/media/signal-grid"
import { JsonLd } from "@/components/seo/json-ld"


export const metadata: Metadata = pageMetadata({
  title: `${siteConfig.name} · Senior software studio for web apps, payments and platforms`,
  absoluteTitle: true,
  description: siteConfig.description,
  path: "/",
})

const BEHIND_PRODUCT = [0.72, 0.9] as const

export default async function HomePage() {
  const posts = await getLatestPosts(6)

  return (
    <>
      <JsonLd data={[websiteSchema(), faqSchema()]} />
      <section className="relative isolate flex min-h-[calc(100svh-3.5rem-3.85rem)] flex-col overflow-clip bg-background lg:min-h-[calc(100svh-3.5rem-5.4rem)]">
        <SignalGrid
          origin={BEHIND_PRODUCT}
          peak={0.32}
          className="-z-10 [mask-image:linear-gradient(to_bottom,transparent_45%,black_85%)] opacity-80 lg:[mask-image:radial-gradient(ellipse_55%_75%_at_72%_75%,black_30%,transparent)]"
        />
        <div className="container-page grid flex-1 grid-rows-[auto_1fr] gap-6 pt-4 md:gap-10 md:pt-12 lg:grid-cols-12 lg:grid-rows-1 lg:pt-0 lg:[--hero-top:max(2rem,calc((100svh-3.5rem-5.4rem-36rem)/2))]">
          <div className="lg:col-span-5 lg:row-start-1 lg:self-start lg:pt-(--hero-top) lg:pb-10">
            <Link
              href={hero.news.href}
              className="group inline-flex min-h-11 items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="chip-brand px-2 py-0.5">New</span>
              {hero.news.label}
              <ChevronRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
            <h1 className="mt-4 text-display md:mt-6">
              {hero.title}{" "}
              <span className="block text-muted-foreground">{hero.accent}</span>
            </h1>
            <p className="mt-4 max-w-xl text-lead md:mt-6">{hero.lead}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap md:mt-8">
              <Button asChild size="lg">
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={hero.secondaryCta.href}>
                  {hero.secondaryCta.label}
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground md:mt-6 [@media(max-height:820px)]:hidden">
              Founded {siteConfig.foundingYear} · Run by its founders ·{" "}
              {siteConfig.location.label}
            </p>
          </div>
          <div className="relative min-h-16 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:flex lg:min-h-0 lg:self-stretch lg:pt-(--hero-top)">
            <div className="absolute inset-x-0 top-0 lg:static lg:flex lg:w-full">
              <HeroStage alt={hero.imageAlt} />
            </div>
          </div>
        </div>
      </section>

      <ProofStrip />

      <Approach />

      <section aria-labelledby="services-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="services-title"
            title="What we do."
            accent="From first commit to production."
            action={<ArrowLink href="/services">All services</ArrowLink>}
          />
          <div className="mt-12">
            <ServicesBento />
          </div>
        </div>
      </section>

      <section aria-labelledby="process-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="process-title"
            title="A disciplined process."
            accent="From day one."
            lead="Every engagement runs the same way: clear scope, steady progress you can see, and software that keeps working long after launch."
          />
          <div className="mt-12">
            <ProcessSteps />
          </div>
          <TextLink href="/services#process" className="mt-8">
            See each step with a real example
          </TextLink>
        </div>
      </section>

      {caseStudies.length > 0 ? (
        <section aria-labelledby="work-title" className="border-t section">
          <div className="container-page">
            <SectionHeading
              id="work-title"
              title="Proof, not promises."
              accent="We run what we build."
            />
          </div>
          <div className="mt-10">
            <StoryCarousel
              studies={caseStudies}
              action={<ArrowLink href="/work">All work</ArrowLink>}
            />
          </div>
        </section>
      ) : null}

      <section
        id="faq"
        aria-labelledby="faq-title"
        className="border-t section"
      >
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <h2 id="faq-title" className="relative text-h2 lg:col-span-4">
            <HeadingTick />
            Questions,{" "}
            <span className="block text-muted-foreground">answered.</span>
          </h2>
          <div className="lg:col-span-8">
            <FaqList />
          </div>
        </div>
      </section>

      {posts.length > 0 ? (
        <section aria-labelledby="writing-title" className="border-t section">
          <div className="container-page">
            <SectionHeading
              id="writing-title"
              title="Latest writing."
              accent="What we're learning in production."
            />
          </div>
          <div className="mt-10">
            <ArticleRail
              posts={posts}
              action={<ArrowLink href="/articles">All articles</ArrowLink>}
            />
          </div>
        </section>
      ) : null}

      <CtaBand />
    </>
  )
}
