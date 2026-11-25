import { BentoGrid } from "@/components/media/bento-grid"

import { services } from "../content"

export function ServicesBento() {
  return (
    <BentoGrid
      label="Services"
      items={services.map((service) => ({
        id: service.slug,
        title: service.title,
        description: service.summary,
        href: `/services#${service.slug}`,
        image: service.capture.image,
        alt: service.capture.alt,
        span: service.capture.span,
      }))}
    />
  )
}
