import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { caseStudies } from "../content"
import { StoryCarousel } from "./story-carousel"

describe("StoryCarousel", () => {
  it("tells each case study as a story card with two real figures", () => {
    render(<StoryCarousel studies={caseStudies} />)
    const stories = within(
      screen.getByRole("list", { name: "Case studies" })
    ).getAllByRole("listitem")

    expect(stories).toHaveLength(caseStudies.length)
    caseStudies.forEach((study, index) => {
      const story = within(stories[index] ?? document.body)
      expect(
        story.getByRole("heading", { name: study.story.headline })
      ).toBeInTheDocument()
      for (const fact of study.facts.slice(0, 2)) {
        expect(story.getByText(fact.value)).toBeVisible()
        expect(story.getByText(fact.label)).toBeVisible()
      }
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
})
