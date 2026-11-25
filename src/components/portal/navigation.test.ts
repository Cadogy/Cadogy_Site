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
        group: "Your account",
        items: ["Dashboard", "Billing", "Team", "Support", "Account"],
      },
    ])
  })

  it("groups the studio by job: the work, the inbox, then settings", () => {
    expect(labels("admin")).toEqual([
      {
        group: "Studio",
        items: ["Overview", "Invoices", "Clients", "Services", "Credit notes"],
      },
      { group: "Inbox", items: ["Inquiries", "Tickets"] },
      { group: "Settings", items: ["Billing settings", "Users"] },
      { group: "You", items: ["Account"] },
    ])
  })

  it("adds the security page for the owner only", () => {
    const settings = (role: "owner" | "admin") =>
      portalNavigation(role)
        .find((group) => group.label === "Settings")
        ?.items.map((item) => item.label)
    expect(settings("owner")).toContain("Security")
    expect(settings("admin")).not.toContain("Security")
  })

  it("marks the inbox links so the sidebar can show what is waiting", () => {
    const counted = portalNavigation("owner")
      .flatMap((group) => group.items)
      .filter((item) => item.count)
      .map((item) => [item.label, item.count])
    expect(counted).toEqual([
      ["Inquiries", "inquiries"],
      ["Tickets", "tickets"],
    ])
  })

  it("marks the overview links as exact so sub-pages don't light them up", () => {
    const exact = (role: "owner" | "client") =>
      portalNavigation(role)
        .flatMap((group) => group.items)
        .filter((item) => item.exact)
        .map((item) => item.href)
    expect(exact("owner")).toEqual(["/admin"])
    expect(exact("client")).toEqual(["/dashboard"])
  })

  it("gives every destination an icon for the collapsed sidebar", () => {
    const items = portalNavigation("owner").flatMap((group) => group.items)
    expect(items.every((item) => item.icon)).toBe(true)
  })
})
