import { describe, expect, it } from "vitest"

import { portalNavigation } from "./navigation"

const labels = (role: Parameters<typeof portalNavigation>[0]) =>
  portalNavigation(role).map((group) => ({
    group: group.label,
    items: group.items.map((item) => item.label),
  }))

describe("portalNavigation", () => {
  it("shows clients only their own account", () => {
    expect(labels("client")).toEqual([
      {
        group: "My account",
        items: ["Dashboard", "Billing", "Team", "Support", "Account"],
      },
    ])
  })

  it("shows staff the studio first, then their own account", () => {
    expect(labels("admin")).toEqual([
      {
        group: "Studio",
        items: [
          "Overview",
          "Invoices",
          "Clients",
          "Credit notes",
          "Services",
          "Billing settings",
          "Inquiries",
          "Tickets",
          "Users",
        ],
      },
      {
        group: "My account",
        items: ["Dashboard", "Billing", "Team", "Support", "Account"],
      },
    ])
  })

  it("adds the security page for the owner only", () => {
    const studio = (role: "owner" | "admin") =>
      portalNavigation(role)[0]?.items.map((item) => item.label)
    expect(studio("owner")).toContain("Security")
    expect(studio("admin")).not.toContain("Security")
  })

  it("marks the overview links as exact so sub-pages don't light them up", () => {
    const exact = portalNavigation("owner")
      .flatMap((group) => group.items)
      .filter((item) => item.exact)
      .map((item) => item.href)
    expect(exact).toEqual(["/admin", "/dashboard"])
  })

  it("gives every destination an icon for the collapsed sidebar", () => {
    const items = portalNavigation("owner").flatMap((group) => group.items)
    expect(items.every((item) => item.icon)).toBe(true)
  })
})
