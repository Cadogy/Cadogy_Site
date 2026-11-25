import { caseStudies, services } from "@/features/marketing/content"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SiteFooter } from "./site-footer"

vi.mock("next/cache", () => ({ cacheLife: () => undefined }))

const column = (name: string) =>
  within(screen.getByRole("navigation", { name }))

describe("SiteFooter", () => {
  it("links to every service", async () => {
    render(await SiteFooter())

    services.forEach((service) =>
      expect(
        column("Services").getByRole("link", { name: service.title })
      ).toHaveAttribute("href", `/services#${service.slug}`)
    )
  })

  it("links to every case study", async () => {
    render(await SiteFooter())

    caseStudies.forEach((study) =>
      expect(
        column("Work").getByRole("link", { name: study.name })
      ).toHaveAttribute("href", `/work/${study.slug}`)
    )
  })

  it("keeps the legal pages and client sign-in a click away", async () => {
    render(await SiteFooter())

    expect(
      column("Legal").getByRole("link", { name: "Privacy policy" })
    ).toBeInTheDocument()
    expect(
      column("Clients").getByRole("link", { name: "Sign in" })
    ).toHaveAttribute("href", "/login")
  })

  it("shows this year in the copyright line", async () => {
    render(await SiteFooter())

    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} Cadogy`))
    ).toBeInTheDocument()
  })
})
