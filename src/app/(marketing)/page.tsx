import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLink } from "@/features/marketing/components/arrow-link"
import { CaseStudyFeature } from "@/features/marketing/components/case-study-feature"
import { CtaBand } from "@/features/marketing/components/cta-band"
import { FaqList } from "@/features/marketing/components/faq-list"
import { ProcessSteps } from "@/features/marketing/components/process-steps"
import { SectionHeading } from "@/features/marketing/components/section-heading"
import {
  caseStudies,
  hero,
  services,
  statement,
} from "@/features/marketing/content"

import { faqSchema, websiteSchema } from "@/lib/seo/structured-data"
import {
  decodeHtml,
  extractExcerpt,
  featuredImageOf,
  formatDate,
  getLatestPosts,
} from "@/lib/wordpress-api"
import { Button } from "@/components/ui/button"
import {
  CinematicCarousel,
  type CinematicSlide,
} from "@/components/media/cinematic-carousel"
import { MediaCard } from "@/components/media/media-card"
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
  const [featured] = caseStudies
  const posts = await getLatestPosts(3)

  const slides: CinematicSlide[] = [
    ...(featured
      ? [
          {
            id: `work-${featured.slug}`,
            image: featured.cover,
            alt: `${featured.name} marketplace artwork`,
            meta: `Case study · ${featured.category}`,
            title: featured.name,
            description: featured.summary,
            href: `/work/${featured.slug}`,
            cta: "Read the case study",
          },
        ]
      : []),
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      image: featuredImageOf(post),
      alt: "",
      meta: `Article · ${formatDate(post.date_gmt)}`,
      title: decodeHtml(post.title.rendered),
      description: extractExcerpt(post.excerpt.rendered, 160),
      href: `/articles/${post.slug}`,
      cta: "Read article",
    })),
  ]

  return (
    <>
      <JsonLd data={[websiteSchema(), faqSchema()]} />
      <section className="container-page grid gap-10 pt-14 pb-12 md:pt-20 md:pb-16 lg:grid-cols-12 lg:items-end lg:gap-12 xl:pt-24">
        <h1 className="text-display lg:col-span-8">
          {hero.title} <span className="block serif-accent">{hero.accent}</span>
        </h1>
        <div className="lg:col-span-4 lg:pb-3">
          <p className="text-lead">{hero.lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={hero.secondaryCta.href}>
                {hero.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <CinematicCarousel label="Featured work and writing" slides={slides} />

      <section aria-label="Our approach" className="container-page section">
        <p className="max-w-5xl text-statement">
          {statement.lead}{" "}
          <span className="text-muted-foreground">{statement.rest}</span>
        </p>
      </section>

      <section
        aria-labelledby="services-title"
        className="container-page pb-24 md:pb-32 xl:pb-40"
      >
        <SectionHeading
          id="services-title"
          title="What we do,"
          accent="from first commit to production."
          action={<ArrowLink href="/services">All services</ArrowLink>}
        />
        <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-3">
          {services
            .filter((service) => service.featured)
            .map((service) => (
              <MediaCard
                key={service.slug}
                image={service.image}
                alt=""
                title={service.title}
                description={service.summary}
                href={`/services#${service.slug}`}
              />
            ))}
        </div>
      </section>

      <section aria-labelledby="process-title" className="border-t section">
        <div className="container-page">
          <SectionHeading
            id="process-title"
            title="A disciplined process,"
            accent="from day one."
            lead="Every engagement runs the same way: clear scope, steady progress you can see, and software that keeps working long after launch."
          />
          <div className="mt-14">
            <ProcessSteps />
          </div>
        </div>
      </section>

      {featured ? (
        <section aria-labelledby="work-title" className="border-t section">
          <div className="container-page">
            <SectionHeading
              id="work-title"
              title="Proof, not promises."
              accent="We run what we build."
              action={<ArrowLink href="/work">All work</ArrowLink>}
            />
            <div className="mt-14">
              <CaseStudyFeature study={featured} />
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
          <h2 id="faq-title" className="text-h2 lg:col-span-4">
            Questions, <span className="serif-accent">answered.</span>
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
