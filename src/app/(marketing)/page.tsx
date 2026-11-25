import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLink } from "@/features/marketing/components/arrow-link"
import { ArticleCard } from "@/features/marketing/components/article-card"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { FaqList } from "@/features/marketing/components/faq-list"
import { HeadingTick } from "@/features/marketing/components/heading-tick"
import { ProcessSteps } from "@/features/marketing/components/process-steps"
import { ProofStrip } from "@/features/marketing/components/proof-strip"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import { ServicesBento } from "@/features/marketing/components/services-bento"
import { StoryCarousel } from "@/features/marketing/components/story-carousel"
import { caseStudies, hero, statement } from "@/features/marketing/content"
import { ChevronRight } from "lucide-react"

import { siteConfig } from "@/config/site"
import { faqSchema, websiteSchema } from "@/lib/seo/structured-data"
import { getLatestPosts } from "@/lib/wordpress-api"
import { Button } from "@/components/ui/button"
import { TextLink } from "@/components/ui/text-link"
import { JsonLd } from "@/components/seo/json-ld"

export const revalidate = 3600

export const metadata: Metadata = {
  title: {
    absolute:
      "Cadogy — Senior software studio for web apps, payments & platforms",
  },
  alternates: { canonical: "/" },
}

export default async function HomePage() {
  const posts = await getLatestPosts(3)

  return (
    <>
      <JsonLd data={[websiteSchema(), faqSchema()]} />
      <section className="overflow-x-clip">
        <div className="container-page grid items-center gap-12 pt-12 pb-16 md:pt-16 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-20">
          <div className="lg:col-span-6 xl:col-span-5">
            <Link
              href={hero.news.href}
              className="group inline-flex min-h-11 items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="rounded-chip border bg-card px-2 py-0.5 font-mono text-xs text-brand">
                New
              </span>
              {hero.news.label}
              <ChevronRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
            <h1 className="mt-6 text-display">
              {hero.title}{" "}
              <span className="block text-muted-foreground">{hero.accent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lead">{hero.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
            <p className="mt-6 text-sm text-muted-foreground">
              Founded {siteConfig.foundingYear} · Run by its founders ·{" "}
              {siteConfig.location.label}
            </p>
          </div>
          <div className="lg:col-span-6 xl:col-span-7">
            <Image
              src="/images/studio/hero-products-v6.webp"
              alt={hero.imageAlt}
              width={2490}
              height={1710}
              priority
              sizes="(min-width: 1024px) 70vw, 100vw"
              quality={85}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <ProofStrip />

      <section aria-label="Our approach" className="border-t section">
        <div className="container-page">
          <p className="max-w-4xl text-statement">
            {statement.lead}{" "}
            <span className="text-muted-foreground">{statement.rest}</span>
          </p>
        </div>
      </section>

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
              action={
                <span className="ml-2">
                  <ArrowLink href="/work">All work</ArrowLink>
                </span>
              }
            />
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section aria-labelledby="writing-title" className="border-t section">
          <div className="container-page">
            <SectionHeading
              id="writing-title"
              title="Latest writing."
              accent="What we're learning in production."
              action={<ArrowLink href="/articles">All articles</ArrowLink>}
            />
            <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-3">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
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
            Questions, <span className="text-muted-foreground">answered.</span>
          </h2>
          <div className="lg:col-span-8">
            <FaqList />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
