import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function MediaCard({
  image,
  alt,
  title,
  description,
  href,
  meta,
  aspect = "portrait",
  headingLevel = 3,
}: {
  image: string
  alt: string
  title: string
  description: string
  href: string
  meta?: string
  aspect?: "portrait" | "landscape"
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <article className="group relative flex flex-col">
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] bg-card",
          aspect === "portrait" ? "aspect-4/5" : "aspect-16/10"
        )}
      >
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(min-width: 768px) 70vw, 230vw"
          quality={85}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {aspect === "portrait" ? (
          <>
            <div aria-hidden="true" className="absolute inset-0 media-scrim" />
            <Heading className="absolute inset-x-0 bottom-0 p-6 text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)] leading-tight font-medium tracking-[-0.02em] text-white">
              <Link
                href={href}
                className="after:absolute after:inset-0 after:z-10"
              >
                {title}
              </Link>
            </Heading>
          </>
        ) : null}
      </div>
      {aspect === "landscape" ? (
        <Heading className="mt-5 text-h3">
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </Heading>
      ) : null}
      <p
        className={cn(
          "text-pretty text-muted-foreground",
          aspect === "portrait" ? "mt-4" : "mt-2"
        )}
      >
        {description}
      </p>
      {meta ? <p className="mt-3 text-meta">{meta}</p> : null}
    </article>
  )
}
