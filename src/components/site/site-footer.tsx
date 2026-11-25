import Link from "next/link"
import { caseStudies, services } from "@/features/marketing/content"
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa6"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { DotField } from "@/components/media/dot-field"

import { Logo } from "./logo"

const columns = [
  { title: "Studio", links: siteConfig.nav },
  {
    title: "Services",
    links: services.map((service) => ({
      label: service.title,
      href: `/services#${service.slug}`,
    })),
  },
  {
    title: "Work",
    links: caseStudies.map((study) => ({
      label: study.name,
      href: `/work/${study.slug}`,
    })),
  },
  {
    title: "Clients",
    links: [
      { label: "Start a project", href: "/contact" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/policies/privacy-policy" },
      { label: "Terms of use", href: "/policies/terms-of-use" },
    ],
  },
] as const

const socials = [
  {
    label: "Cadogy on LinkedIn",
    href: siteConfig.social.linkedin,
    Icon: FaLinkedin,
  },
  { label: "Cadogy on GitHub", href: siteConfig.social.github, Icon: FaGithub },
  {
    label: "Cadogy on Instagram",
    href: siteConfig.social.instagram,
    Icon: FaInstagram,
  },
] as const

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t">
      <DotField className="-z-10" />
      <div className="container-page grid gap-12 py-16 md:py-20 lg:grid-cols-12">
        <div className="flex flex-col items-start lg:col-span-3">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A two-person senior software studio. Founded in{" "}
            {siteConfig.foundingYear} in {siteConfig.location.label}, working
            with clients everywhere.
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="mt-3 inline-flex min-h-11 items-center text-sm text-foreground underline-offset-4 hover:underline"
          >
            {siteConfig.email}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-9 lg:grid-cols-5">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm text-muted-foreground">{column.title}</p>
              <ul className="mt-4 grid gap-0.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center text-sm text-foreground/90 transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="container-page">
        <div className="flex flex-col-reverse items-start justify-between gap-4 pb-8 sm:flex-row sm:items-center">
          <p className="text-meta">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="-ml-3 flex items-center gap-1 sm:-mr-3 sm:ml-0">
            {socials.map(({ label, href, Icon }) => (
              <li key={href}>
                <Button asChild variant="quiet" size="icon">
                  <a
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
