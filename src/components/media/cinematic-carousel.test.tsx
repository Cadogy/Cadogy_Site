import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CinematicCarousel, type CinematicSlide } from "./cinematic-carousel"

const slides: CinematicSlide[] = [
  {
    id: "a",
    image: "/a.webp",
    alt: "",
    meta: "Case study",
    title: "PlayerBay",
    href: "/work/playerbay",
    cta: "Read the case study",
  },
  {
    id: "b",
    image: "/b.webp",
    alt: "",
    meta: "Article · Jan 29, 2026",
    title: "Modular monoliths",
    href: "/articles/mm",
    cta: "Read article",
  },
  {
    id: "c",
    image: "/c.webp",
    alt: "",
    meta: "Article · Mar 29, 2025",
    title: "Cloudflare basics",
    href: "/articles/cf",
    cta: "Read article",
  },
]

const current = () =>
  screen
    .getAllByRole("button", { name: /^Go to slide/ })
    .findIndex((button) => button.getAttribute("aria-current") === "true")

describe("CinematicCarousel", () => {
  it("exposes an accessible carousel with labelled slides", () => {
    render(
      <CinematicCarousel label="Featured work and writing" slides={slides} />
    )

    const carousel = screen.getByRole("region", {
      name: "Featured work and writing",
    })
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel")
    const groups = within(carousel).getAllByRole("group")
    expect(groups).toHaveLength(3)
    expect(groups[1]).toHaveAttribute("aria-label", "2 of 3")
  })

  it("links every slide to its destination", () => {
    render(<CinematicCarousel label="Featured" slides={slides} />)
    expect(screen.getByRole("link", { name: /PlayerBay/ })).toHaveAttribute(
      "href",
      "/work/playerbay"
    )
    expect(
      screen.getByRole("link", { name: /Cloudflare basics/ })
    ).toHaveAttribute("href", "/articles/cf")
  })

  it("moves with the previous and next controls and stops at the ends", async () => {
    const user = userEvent.setup()
    render(<CinematicCarousel label="Featured" slides={slides} />)

    expect(
      screen.getByRole("button", { name: "Previous slide" })
    ).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(current()).toBe(2)
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Previous slide" }))
    expect(current()).toBe(1)
  })

  it("jumps straight to a slide from its indicator", async () => {
    const user = userEvent.setup()
    render(<CinematicCarousel label="Featured" slides={slides} />)
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }))
    expect(current()).toBe(2)
  })

  it("responds to the arrow keys", () => {
    render(<CinematicCarousel label="Featured" slides={slides} />)
    const carousel = screen.getByRole("region", { name: "Featured" })
    fireEvent.keyDown(carousel, { key: "ArrowRight" })
    expect(current()).toBe(1)
    fireEvent.keyDown(carousel, { key: "ArrowLeft" })
    expect(current()).toBe(0)
  })

  it("renders nothing without slides", () => {
    const { container } = render(
      <CinematicCarousel label="Featured" slides={[]} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("shows one full-bleed image per slide, art-directed for portrait screens", () => {
    render(
      <CinematicCarousel
        label="Featured"
        slides={[
          {
            ...slides[0]!,
            image: "/product.webp",
            mobileImage: "/product-mobile.webp",
            alt: "PlayerBay homepage",
          },
        ]}
      />
    )
    const images = screen.getAllByRole("img", { name: "PlayerBay homepage" })
    expect(images.map((image) => image.getAttribute("src"))).toEqual([
      expect.stringContaining("product-mobile.webp"),
      expect.stringContaining("product.webp"),
    ])
  })

  it("brings a peeking neighbour to the centre instead of opening it", async () => {
    const user = userEvent.setup()
    render(<CinematicCarousel label="Featured" slides={slides} />)

    await user.click(
      screen.getByRole("button", { name: "Show slide 2: Modular monoliths" })
    )
    expect(current()).toBe(1)

    await user.click(
      screen.getByRole("button", { name: "Show slide 1: PlayerBay" })
    )
    expect(current()).toBe(0)
  })

  it("only lets the centred slide be opened", async () => {
    const user = userEvent.setup()
    render(<CinematicCarousel label="Featured" slides={slides} />)

    expect(
      screen.queryByRole("button", { name: /Show slide 1/ })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Show slide 2: Modular monoliths" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(
      screen.queryByRole("button", { name: /Show slide 2/ })
    ).not.toBeInTheDocument()
  })
})
