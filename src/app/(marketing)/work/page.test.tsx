import { caseStudies } from "@/features/marketing/content"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

const { default: WorkPage } = await import("./page")

describe("Work page", () => {
  it("has a single h1", () => {
    render(<WorkPage />)

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("tells every case study as a story with its headline and real figures", () => {
    render(<WorkPage />)
    const stories = within(
      screen.getByRole("list", { name: "Case studies" })
    ).getAllByRole("listitem")

    expect(stories).toHaveLength(caseStudies.length)
    caseStudies.forEach((study, index) => {
      const story = within(stories[index] ?? document.body)
      expect(
        story.getByRole("heading", { level: 2, name: study.story.headline })
      ).toBeInTheDocument()
      expect(story.getByText(study.facts[0]?.value ?? "")).toBeVisible()
      expect(
        story.getByRole("link", { name: `Read the ${study.name} case study` })
      ).toHaveAttribute("href", `/work/${study.slug}`)
    })
  })
})
