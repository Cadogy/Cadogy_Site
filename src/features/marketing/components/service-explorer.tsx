"use client"

import { useEffect, useId, useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

import { services, type Service } from "../content"

const indexFromHash = () =>
  services.findIndex((service) => `#${service.slug}` === window.location.hash)

function Capture({
  service,
  sizes,
  eager = false,
}: {
  service: Service
  sizes: string
  eager?: boolean
}) {
  return (
    <div className="relative isolate aspect-video transform-gpu overflow-hidden rounded-media bg-card">
      <Image
        key={service.capture.image}
        src={service.capture.image}
        alt={service.capture.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        quality={85}
        className="animate-in object-cover object-top duration-300 fade-in motion-reduce:animate-none"
      />
    </div>
  )
}

export function ServiceExplorer() {
  const id = useId()
  const [active, setActive] = useState(0)
  const service = services[active] ?? services[0]

  useEffect(() => {
    const sync = () => {
      const index = indexFromHash()
      if (index < 0) return
      setActive(index)
      requestAnimationFrame(() =>
        document
          .getElementById(services[index]?.slug ?? "")
          ?.scrollIntoView({ block: "start" })
      )
    }
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  if (!service) return null

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <ol aria-label="Services" className="rule-list lg:col-span-5">
        {services.map((item, index) => {
          const open = index === active
          return (
            <li key={item.slug} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -top-px left-0 h-px bg-brand transition-[width] duration-500 ease-soft motion-reduce:transition-none",
                  open ? "w-full" : "w-0"
                )}
              />
              <h2>
                <button
                  id={item.slug}
                  type="button"
                  aria-expanded={open}
                  aria-controls={`${id}-${item.slug}`}
                  onClick={() => setActive(index)}
                  className={cn(
                    "flex min-h-16 w-full scroll-mt-24 items-center gap-5 text-left text-h3 transition-colors",
                    open
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      open ? "text-brand" : "text-muted-foreground"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.title}
                </button>
              </h2>
              {open ? (
                <div
                  id={`${id}-${item.slug}`}
                  role="region"
                  aria-labelledby={item.slug}
                  className="animate-in pb-8 pl-10 duration-300 fade-in motion-reduce:animate-none"
                >
                  <p className="text-muted-foreground">{item.detail}</p>
                  <ul className="mt-5 grid gap-2.5 text-sm">
                    {item.includes.map((include) => (
                      <li key={include} className="flex items-start gap-2.5">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        {include}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 -ml-10 lg:hidden">
                    <Capture service={item} sizes="100vw" />
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <div className="hidden lg:col-span-7 lg:block">
        <div className="sticky top-24">
          <Capture
            service={service}
            sizes="(min-width: 1360px) 790px, 58vw"
            eager
          />
        </div>
      </div>
    </div>
  )
}
