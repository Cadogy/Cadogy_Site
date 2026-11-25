import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EmptyState } from "@/components/ui/empty-state"

import { FilterTabs, PortalSection, StatList } from "./portal-section"

describe("PortalSection", () => {
  it("is a region named by its heading, with its description and actions", () => {
    render(
      <PortalSection
        title="Team"
        description="Everyone who can sign in."
        actions={<button type="button">Invite</button>}
      >
        <p>Body</p>
      </PortalSection>
    )
    const section = screen.getByRole("region", { name: "Team" })

    expect(
      within(section).getByRole("heading", { level: 2 })
    ).toHaveTextContent("Team")
    expect(
      within(section).getByText("Everyone who can sign in.")
    ).toBeInTheDocument()
    expect(
      within(section).getByRole("button", { name: "Invite" })
    ).toBeInTheDocument()
    expect(within(section).getByText("Body")).toBeInTheDocument()
  })

  it("gives two sections with the same title distinct names", () => {
    render(
      <>
        <PortalSection title="Notes">a</PortalSection>
        <PortalSection title="Notes">b</PortalSection>
      </>
    )
    expect(screen.getAllByRole("region", { name: "Notes" })).toHaveLength(2)
  })
})

describe("StatList", () => {
  it("pairs each label with its value", () => {
    render(
      <StatList
        stats={[
          { label: "Outstanding", value: "$2,500.00" },
          { label: "Overdue", value: "$0.00", detail: "0 invoices" },
        ]}
      />
    )

    expect(screen.getByText("Outstanding").nextSibling).toHaveTextContent(
      "$2,500.00"
    )
    expect(screen.getByText("0 invoices")).toBeInTheDocument()
  })
})

describe("EmptyState", () => {
  it("says what's missing and offers the next step", () => {
    render(
      <EmptyState action={<a href="/new">Add one</a>}>
        No clients yet.
      </EmptyState>
    )

    expect(screen.getByText("No clients yet.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Add one" })).toBeInTheDocument()
  })
})

describe("FilterTabs", () => {
  it("shows how many items each filter holds and marks the current one", () => {
    render(
      <FilterTabs
        label="Filter invoices"
        items={[
          { label: "All", href: "/i", active: true, count: 7 },
          {
            label: "Overdue",
            href: "/i?status=overdue",
            active: false,
            count: 1,
          },
          { label: "Void", href: "/i?status=void", active: false },
        ]}
      />
    )
    const nav = screen.getByRole("navigation", { name: "Filter invoices" })

    expect(within(nav).getByRole("link", { name: "All 7" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(
      within(nav).getByRole("link", { name: "Overdue 1" })
    ).not.toHaveAttribute("aria-current")
    expect(within(nav).getByRole("link", { name: "Void" })).toBeInTheDocument()
  })
})
