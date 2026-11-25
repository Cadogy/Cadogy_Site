import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, onTestFinished, vi } from "vitest"

const pathname = vi.hoisted(() => ({ value: "/" }))

vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }))

const { Logo } = await import("./logo")

const clickLogo = async () => {
  const scrollTo = vi.fn()
  vi.stubGlobal("scrollTo", scrollTo)
  onTestFinished(() => {
    vi.unstubAllGlobals()
  })
  render(<Logo />)
  await userEvent.click(screen.getByRole("link", { name: "Cadogy" }))
  return scrollTo
}

describe("Logo", () => {
  it("links home", () => {
    pathname.value = "/work"
    render(<Logo />)

    expect(screen.getByRole("link", { name: "Cadogy" })).toHaveAttribute(
      "href",
      "/"
    )
  })

  it("jumps straight to the top when you're already on the homepage", async () => {
    pathname.value = "/"

    expect(await clickLogo()).toHaveBeenCalledWith({
      top: 0,
      behavior: "instant",
    })
  })

  it("leaves other pages alone so they don't flash before navigating", async () => {
    pathname.value = "/work/playerbay"

    expect(await clickLogo()).not.toHaveBeenCalled()
  })
})
