import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SectionHeading } from "./section-heading"

describe("SectionHeading", () => {
  it("reads as one heading with a muted second phrase", () => {
    render(
      <SectionHeading
        id="services"
        title="What we do."
        accent="From first commit to production."
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What we do. From first commit to production.",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("From first commit to production.")).toHaveClass(
      "text-muted-foreground"
    )
  })

  it("marks the heading with a tick that screen readers skip", () => {
    const { container } = render(
      <SectionHeading id="process" title="How we work" />
    )

    expect(container.querySelector('[data-slot="tick"]')).toHaveAttribute(
      "aria-hidden",
      "true"
    )
    expect(container.textContent).toBe("How we work")
  })

  it("can leave the tick out where an index already marks the section", () => {
    const { container } = render(
      <SectionHeading id="team" title="The team" tick={false} />
    )

    expect(container.querySelector('[data-slot="tick"]')).toBeNull()
  })
})
