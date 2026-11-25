import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, onTestFinished, vi } from "vitest"

const pathname = vi.hoisted(() => ({ value: "/" }))

vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }))

const { Logo } = await import("./logo")

describe("Logo", () => {
  it("links home", () => {
    pathname.value = "/services"
    render(<Logo />)

    expect(screen.getByRole("link", { name: "Cadogy" })).toHaveAttribute(
      "href",
      "/"
    )
  })

  it("scrolls back to the top when you're already on the homepage", async () => {
    pathname.value = "/"
    const scrollTo = vi.fn()
    vi.stubGlobal("scrollTo", scrollTo)
    onTestFinished(() => {
      vi.unstubAllGlobals()
    })
    render(<Logo />)

    await userEvent.click(screen.getByRole("link", { name: "Cadogy" }))

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
  })
})
