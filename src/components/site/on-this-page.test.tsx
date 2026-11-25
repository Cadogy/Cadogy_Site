import { act, render, screen, within } from "@testing-library/react"
import { describe, expect, it, onTestFinished, vi } from "vitest"

import { OnThisPage } from "./on-this-page"

type Callback = (
  entries: { isIntersecting: boolean; target: Element }[]
) => void

const observe = () => {
  const state: { callback: Callback | null } = { callback: null }
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Callback) {
        state.callback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  onTestFinished(() => {
    vi.unstubAllGlobals()
  })
  return state
}

const sections = [
  { id: "story", label: "Our story" },
  { id: "team", label: "The team" },
]

const page = () => (
  <>
    <OnThisPage items={sections} />
    <section id="story">Story</section>
    <section id="team">Team</section>
  </>
)

describe("OnThisPage", () => {
  it("links to each section on the page", () => {
    observe()
    render(page())
    const index = screen.getByRole("navigation", { name: "On this page" })

    expect(
      within(index).getByRole("link", { name: "The team" })
    ).toHaveAttribute("href", "#team")
  })

  it("highlights the section you're reading", () => {
    const io = observe()
    render(page())

    act(() =>
      io.callback?.([
        {
          isIntersecting: true,
          target: document.getElementById("team") ?? document.body,
        },
      ])
    )

    expect(screen.getByRole("link", { name: "The team" })).toHaveAttribute(
      "aria-current",
      "location"
    )
    expect(screen.getByRole("link", { name: "Our story" })).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("can build its list from the headings in an article", async () => {
    observe()
    render(
      <>
        <OnThisPage headingsFrom="#article" />
        <div id="article">
          <h2>Why it matters</h2>
          <h2 id="setup">Setting it up</h2>
        </div>
      </>
    )

    expect(
      await screen.findByRole("link", { name: "Why it matters" })
    ).toHaveAttribute("href", "#why-it-matters")
    expect(screen.getByRole("link", { name: "Setting it up" })).toHaveAttribute(
      "href",
      "#setup"
    )
  })

  it("treats a paragraph that is only bold text as a section title, as imported posts use", async () => {
    observe()
    render(
      <>
        <OnThisPage headingsFrom="#article" />
        <div id="article">
          <p>
            <strong>What are Managed Rules?</strong>
          </p>
          <p>
            Plain text with <strong>some bold</strong> inside.
          </p>
          <h3>Key benefits</h3>
        </div>
      </>
    )
    const index = await screen.findByRole("navigation", {
      name: "On this page",
    })

    expect(
      within(index)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toEqual(["What are Managed Rules?", "Key benefits"])
  })
})
