import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

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
