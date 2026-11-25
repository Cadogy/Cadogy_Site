import { caseStudies, services } from "@/features/marketing/content"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SiteFooter } from "./site-footer"

const column = (name: string) =>
  within(screen.getByRole("navigation", { name }))

describe("SiteFooter", () => {
  it("links to every service", () => {
    render(<SiteFooter />)

    services.forEach((service) =>
      expect(
        column("Services").getByRole("link", { name: service.title })
      ).toHaveAttribute("href", `/services#${service.slug}`)
    )
  })

  it("links to every case study", () => {
    render(<SiteFooter />)

    caseStudies.forEach((study) =>
      expect(
        column("Work").getByRole("link", { name: study.name })
      ).toHaveAttribute("href", `/work/${study.slug}`)
    )
  })

  it("keeps the legal pages and client sign-in a click away", () => {
    render(<SiteFooter />)

    expect(
      column("Legal").getByRole("link", { name: "Privacy policy" })
    ).toBeInTheDocument()
    expect(
      column("Clients").getByRole("link", { name: "Sign in" })
    ).toHaveAttribute("href", "/login")
  })
})
