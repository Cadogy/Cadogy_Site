import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, onTestFinished, vi } from "vitest"

import { caseStudies } from "../content"
import { CaseStudyShowcase } from "./case-study-showcase"

const readLink = (name: string) =>
  screen.queryByRole("link", {
    name: new RegExp(`read the ${name} case study`, "i"),
  })

describe("CaseStudyShowcase", () => {
  it("offers a tab for every case study and opens on the first", () => {
    render(<CaseStudyShowcase studies={caseStudies} />)

    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual(
      caseStudies.map((study) => study.name)
    )
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(readLink("PlayerBay")).toBeInTheDocument()
    expect(readLink("Sidecar for OpenCode")).not.toBeInTheDocument()
  })

  it("swaps to the case study you pick", async () => {
    const user = userEvent.setup()
    render(<CaseStudyShowcase studies={caseStudies} />)

    await user.click(screen.getByRole("tab", { name: "Sidecar for OpenCode" }))

    expect(
      screen.getByRole("tab", { name: "Sidecar for OpenCode" })
    ).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(
      "Sidecar for OpenCode"
    )
    expect(readLink("Sidecar for OpenCode")).toHaveAttribute(
      "href",
      "/work/opencode-sidecar"
    )
    expect(readLink("PlayerBay")).not.toBeInTheDocument()
  })

  it("links to each product's live site", async () => {
    const user = userEvent.setup()
    render(<CaseStudyShowcase studies={caseStudies} />)

    expect(
      screen.getByRole("link", { name: /visit playerbay\.com/i })
    ).toHaveAttribute("href", "https://playerbay.com")

    await user.click(screen.getByRole("tab", { name: "Sidecar for OpenCode" }))

    expect(
      screen.getByRole("link", { name: /visit opencodesidecar\.com/i })
    ).toHaveAttribute("href", "https://www.opencodesidecar.com")
  })

  it("moves between case studies with the arrow keys", async () => {
    const user = userEvent.setup()
    render(<CaseStudyShowcase studies={caseStudies} />)

    await user.click(screen.getByRole("tab", { name: "PlayerBay" }))
    await user.keyboard("{ArrowRight}")

    const sidecar = screen.getByRole("tab", { name: "Sidecar for OpenCode" })
    expect(sidecar).toHaveFocus()
    expect(sidecar).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "PlayerBay" })).toHaveFocus()
  })
})

const ROTATION_MS = 8000

const renderRotating = () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  onTestFinished(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
  const user = userEvent.setup({ delay: null })
  render(<CaseStudyShowcase studies={caseStudies} />)
  return user
}

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

const selected = () =>
  screen
    .getAllByRole("tab")
    .find((tab) => tab.getAttribute("aria-selected") === "true")
    ?.textContent

const preferReducedMotion = () =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))

describe("CaseStudyShowcase rotation", () => {
  it("moves to the next case study every few seconds and wraps around", async () => {
    renderRotating()

    await wait(ROTATION_MS)
    expect(selected()).toBe("Sidecar for OpenCode")

    await wait(ROTATION_MS)
    expect(selected()).toBe("PlayerBay")
  })

  it("stops for good once a visitor picks a case study", async () => {
    const user = renderRotating()

    await user.click(screen.getByRole("tab", { name: "Sidecar for OpenCode" }))
    await wait(ROTATION_MS * 3)

    expect(selected()).toBe("Sidecar for OpenCode")
    expect(
      screen.getByRole("button", { name: "Play case studies" })
    ).toBeInTheDocument()
  })

  it("can be paused and played again", async () => {
    const user = renderRotating()

    await user.click(screen.getByRole("button", { name: "Pause case studies" }))
    await wait(ROTATION_MS * 2)
    expect(selected()).toBe("PlayerBay")

    await user.click(screen.getByRole("button", { name: "Play case studies" }))
    await wait(ROTATION_MS)
    expect(selected()).toBe("Sidecar for OpenCode")
  })

  it("holds still while the pointer is on the case study", async () => {
    const user = renderRotating()

    await user.hover(screen.getByRole("tabpanel"))
    await wait(ROTATION_MS * 2)
    expect(selected()).toBe("PlayerBay")

    await user.unhover(screen.getByRole("tabpanel"))
    await wait(ROTATION_MS)
    expect(selected()).toBe("Sidecar for OpenCode")
  })

  it("holds still while a link in the case study has keyboard focus", async () => {
    renderRotating()

    act(() => readLink("PlayerBay")?.focus())
    await wait(ROTATION_MS * 2)

    expect(selected()).toBe("PlayerBay")
  })

  it("waits until the section is on screen", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          callback: (entries: readonly { isIntersecting: boolean }[]) => void
        ) {
          callback([{ isIntersecting: false }])
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    renderRotating()

    await wait(ROTATION_MS * 2)

    expect(selected()).toBe("PlayerBay")
  })

  it("never rotates for visitors who prefer reduced motion", async () => {
    preferReducedMotion()
    renderRotating()

    await wait(ROTATION_MS * 2)

    expect(selected()).toBe("PlayerBay")
    expect(
      screen.queryByRole("button", { name: /case studies$/ })
    ).not.toBeInTheDocument()
  })
})
