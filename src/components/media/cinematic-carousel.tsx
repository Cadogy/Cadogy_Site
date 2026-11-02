"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type CinematicSlide = {
  readonly id: string
  readonly image: string
  readonly alt: string
  readonly meta: string
  readonly title: string
  readonly description?: string
  readonly href: string
  readonly cta: string
  readonly mobileImage?: string
}

const IMAGE_MOTION =
  "transition-transform duration-700 ease-out group-hover:scale-[1.02]"

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max)

const controlClass =
  "inline-flex size-11 items-center justify-center rounded-full border border-input text-foreground transition-colors hover:bg-foreground/8 disabled:pointer-events-none disabled:opacity-30"

export function CinematicCarousel({
  label,
  slides,
}: {
  label: string
  slides: readonly CinematicSlide[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const last = slides.length - 1

  const goTo = useCallback(
    (index: number) => {
      const next = clamp(index, last)
      setActive(next)
      const track = trackRef.current
      const slide = track?.children[next]
      if (
        track &&
        slide instanceof HTMLElement &&
        typeof track.scrollTo === "function"
      ) {
        track.scrollTo({
          left:
            slide.offsetLeft -
            track.offsetLeft -
            (track.clientWidth - slide.clientWidth) / 2,
          behavior: "smooth",
        })
      }
    },
    [last]
  )

  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (!visible) return
        setActive(Array.from(track.children).indexOf(visible.target))
      },
      { root: track, threshold: 0.6 }
    )
    Array.from(track.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [slides])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      goTo(active + 1)
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(active - 1)
    }
  }

  if (slides.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="relative"
    >
      <h2 className="sr-only">{label}</h2>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto overscroll-x-contain px-[6vw] md:gap-4 md:px-[8vw] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            className="group relative h-[clamp(500px,76svh,760px)] w-[88vw] shrink-0 snap-center overflow-hidden rounded-[20px] bg-card md:w-[84vw]"
          >
            {slide.mobileImage ? (
              <>
                <Image
                  src={slide.mobileImage}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 1px, 110vw"
                  quality={85}
                  className={cn(
                    "object-cover object-left-top lg:hidden",
                    IMAGE_MOTION
                  )}
                />
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 150vw, 1px"
                  quality={85}
                  className={cn(
                    "hidden object-cover object-top lg:block",
                    IMAGE_MOTION
                  )}
                />
              </>
            ) : (
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 120vw, (min-width: 768px) 160vw, 280vw"
                quality={85}
                className={cn("object-cover", IMAGE_MOTION)}
              />
            )}
            <div aria-hidden="true" className="absolute inset-0 media-scrim" />
            {index === active ? null : (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Show slide ${index + 1}: ${slide.title}`}
                onClick={() => goTo(index)}
                className="absolute inset-0 z-20 cursor-pointer bg-black/35 transition-colors duration-300 hover:bg-black/10"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 sm:p-10 md:flex-row md:items-end md:justify-between lg:p-14">
              <div className="max-w-3xl">
                <p className="text-sm text-white/75">{slide.meta}</p>
                <h3 className="mt-3 text-[clamp(1.875rem,1.2rem+2.6vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance text-white">
                  <Link
                    href={slide.href}
                    className="after:absolute after:inset-0"
                  >
                    {slide.title}
                  </Link>
                </h3>
                {slide.description ? (
                  <p className="mt-4 hidden max-w-xl text-pretty text-white/80 sm:block">
                    {slide.description}
                  </p>
                ) : null}
              </div>
              <span
                aria-hidden="true"
                className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-white/95 px-5 text-sm font-medium text-black transition-colors group-hover:bg-white"
              >
                {slide.cta}
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="container-page mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => goTo(index)}
              className="group/dot flex h-11 items-center px-1"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  index === active
                    ? "w-8 bg-foreground"
                    : "w-1.5 bg-foreground/30 group-hover/dot:bg-foreground/60"
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            className={controlClass}
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className={controlClass}
            disabled={active === last}
            onClick={() => goTo(active + 1)}
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
