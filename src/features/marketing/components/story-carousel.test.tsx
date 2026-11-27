import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { caseStudies } from "../content"
import { StoryCarousel } from "./story-carousel"

describe("StoryCarousel", () => {
  it("tells each case study as a story card with what it promises its users", () => {
    render(<StoryCarousel studies={caseStudies} />)
    // Only the cards themselves; each card has its own list of promises.
    const stories = [
      ...screen.getByRole("list", { name: "Case studies" }).children,
    ] as HTMLElement[]

    expect(stories).toHaveLength(caseStudies.length)
    caseStudies.forEach((study, index) => {
      const story = within(stories[index] ?? document.body)
      expect(
        story.getByRole("heading", { name: study.story.headline })
      ).toBeInTheDocument()
      const promises = story.getByRole("list", {
        name: `What ${study.name} promises`,
      })
      expect(
        within(promises)
          .getAllByRole("listitem")
          .map((item) => item.textContent)
      ).toEqual(study.promises.slice(0, 3))
      expect(
        story.getByRole("link", { name: `Read the ${study.name} case study` })
      ).toHaveAttribute("href", `/work/${study.slug}`)
    })
  })

  it("starts at the first story, so there is nothing to go back to", () => {
    render(<StoryCarousel studies={caseStudies} />)

    expect(
      screen.getByRole("button", { name: "Previous story" })
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next story" })).toBeEnabled()
  })

  it("can be dragged sideways with a mouse", () => {
    render(<StoryCarousel studies={caseStudies} />)
    const track = screen.getByRole("list", { name: "Case studies" })

    fireEvent.pointerDown(track, {
      pointerType: "mouse",
      button: 0,
      clientX: 600,
    })
    fireEvent.pointerMove(track, { pointerType: "mouse", clientX: 300 })
    fireEvent.pointerUp(track, { pointerType: "mouse", clientX: 300 })

    expect(track.scrollLeft).toBe(300)
  })

  it("glides on after a flick and eases to a natural stop", () => {
    render(<StoryCarousel studies={caseStudies} />)
    const track = screen.getByRole("list", { name: "Case studies" })
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    vi.stubGlobal("cancelAnimationFrame", () => {})
    const now = vi.spyOn(performance, "now")

    now.mockReturnValue(0)
    fireEvent.pointerDown(track, {
      pointerType: "mouse",
      button: 0,
      clientX: 800,
    })
    now.mockReturnValue(16)
    fireEvent.pointerMove(track, { pointerType: "mouse", clientX: 760 })
    now.mockReturnValue(32)
    fireEvent.pointerMove(track, { pointerType: "mouse", clientX: 720 })
    fireEvent.pointerUp(track, { pointerType: "mouse", clientX: 720 })
    const released = track.scrollLeft

    const positions: number[] = []
    for (let frame = 0; frame < 400 && frames.length > 0; frame++) {
      frames.shift()?.(frame * 16)
      positions.push(track.scrollLeft)
    }
    now.mockRestore()
    vi.unstubAllGlobals()

    const steps = positions.map(
      (position, index) => position - (positions[index - 1] ?? released)
    )
    expect(track.scrollLeft).toBeGreaterThan(released + 50)
    expect(track.scrollLeft).toBeLessThan(released + 1500)
    expect(steps.at(-1) ?? 0).toBeLessThan(steps[0] ?? 0)
    expect(frames).toHaveLength(0)
  })
})
