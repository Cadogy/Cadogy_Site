import { fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TopicScroller } from "./topic-scroller"

const topics = [
  { label: "All articles", href: "/articles", current: false },
  { label: "AI", href: "/articles/category/ai", current: false },
  { label: "Payments", href: "/articles/category/payments", current: true },
]

const sizeRow = ({
  scrollWidth,
  clientWidth,
}: {
  scrollWidth: number
  clientWidth: number
}) => {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
    scrollWidth
  )
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    clientWidth
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("TopicScroller", () => {
  it("links every topic and marks the one you're reading", () => {
    sizeRow({ scrollWidth: 300, clientWidth: 300 })
    render(<TopicScroller topics={topics} />)

    const nav = within(screen.getByRole("navigation", { name: "Topics" }))
    expect(nav.getByRole("link", { name: "Payments" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(nav.getByRole("link", { name: "AI" })).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("hides the arrows when every topic fits", () => {
    sizeRow({ scrollWidth: 300, clientWidth: 300 })
    render(<TopicScroller topics={topics} />)

    expect(
      screen.queryByRole("button", { name: "Scroll topics right" })
    ).not.toBeInTheDocument()
  })

  it("scrolls the row with the arrows when topics overflow", () => {
    sizeRow({ scrollWidth: 900, clientWidth: 300 })
    const scrollBy = vi.fn()
    HTMLElement.prototype.scrollBy = scrollBy
    render(<TopicScroller topics={topics} />)

    expect(
      screen.getByRole("button", { name: "Scroll topics left" })
    ).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Scroll topics right" }))

    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ left: expect.any(Number) })
    )
    expect(scrollBy.mock.calls[0]?.[0].left).toBeGreaterThan(0)
  })
})
