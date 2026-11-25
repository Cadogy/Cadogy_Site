import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { WP_Post } from "@/types/wordpress"

import { ArticleRail } from "./article-rail"

type WP_Media = NonNullable<
  NonNullable<WP_Post["_embedded"]>["wp:featuredmedia"]
>[number]

const cover = (): WP_Media => ({
  id: 9,
  date: "2026-01-29T12:00:00",
  slug: "cover",
  type: "attachment",
  link: "",
  title: { rendered: "Cover" },
  author: 1,
  caption: { rendered: "" },
  alt_text: "",
  media_type: "image",
  mime_type: "image/webp",
  media_details: {
    width: 2400,
    height: 1350,
    file: "cover.webp",
    sizes: {},
    image_meta: {
      aperture: "",
      credit: "",
      camera: "",
      caption: "",
      created_timestamp: "",
      copyright: "",
      focal_length: "",
      iso: "",
      shutter_speed: "",
      title: "",
      orientation: "",
    },
  },
  source_url: "https://wp.cadogy.com/wp-content/uploads/cover.webp",
})

const post = (overrides: Partial<WP_Post> = {}): WP_Post => ({
  id: 1,
  date: "2026-01-29T12:00:00",
  date_gmt: "2026-01-29T12:00:00",
  guid: { rendered: "" },
  modified: "2026-01-29T12:00:00",
  modified_gmt: "2026-01-29T12:00:00",
  slug: "modular-monoliths",
  status: "publish",
  type: "post",
  link: "",
  title: { rendered: "Why modular monoliths are winning" },
  content: { rendered: "<p>Body</p>", protected: false },
  excerpt: {
    rendered: "<p>Microservices promised scale.</p>",
    protected: false,
  },
  author: 1,
  featured_media: 0,
  comment_status: "closed",
  ping_status: "closed",
  sticky: false,
  template: "",
  format: "standard",
  meta: {},
  categories: [],
  tags: [],
  _embedded: { author: [], "wp:featuredmedia": [cover()] },
  ...overrides,
})

const requestedWidths = (sizes: string | null) =>
  (sizes ?? "")
    .split(",")
    .map((entry) => Number.parseInt(entry.trim().split(" ").pop() ?? "", 10))

describe("ArticleRail", () => {
  it("requests covers at the width they render after the portrait crop", () => {
    const { container } = render(<ArticleRail posts={[post()]} />)
    screen.getByRole("link", { name: "Why modular monoliths are winning" })
    const image = container.querySelector("img")
    const slideWidths = [352, 320, 272]
    const coverWidthInSlide = (slide: number) =>
      Math.ceil(((slide * 8) / 7) * (16 / 9))

    expect(requestedWidths(image?.getAttribute("sizes") ?? null)).toEqual(
      slideWidths.map(coverWidthInSlide)
    )
  })
})
