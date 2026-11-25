import { useId } from "react"
import Image from "next/image"
import Link from "next/link"

export function MediaCard({
  image,
  alt,
  title,
  description,
  href,
  meta,
  kicker,
  sizes = "(min-width: 768px) 40vw, 112vw",
  headingLevel = 3,
}: {
  image: string
  alt: string
  title: string
  description: string
  href: string
  meta?: React.ReactNode
  kicker?: React.ReactNode
  sizes?: string
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const titleId = useId()
  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex reveal flex-col"
    >
      <div className="relative isolate aspect-16/10 transform-gpu overflow-hidden rounded-media bg-card">
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          quality={85}
          className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]"
        />
      </div>
      {kicker ? (
        <p className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
          {kicker}
        </p>
      ) : null}
      <Heading
        id={titleId}
        className={kicker ? "mt-3 text-h3" : "mt-5 text-h3"}
      >
        <Link href={href} className="after:absolute after:inset-0">
          {title}
        </Link>
      </Heading>
      <p className="mt-2 line-clamp-2 text-pretty text-muted-foreground">
        {description}
      </p>
      {meta ? <p className="mt-3 text-meta">{meta}</p> : null}
    </article>
  )
}
