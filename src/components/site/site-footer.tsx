import Link from "next/link"
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa6"

import { siteConfig } from "@/config/site"

const columns = [
  {
    title: "Studio",
    links: [
      { label: "Work", href: "/work" },
      { label: "Services", href: "/services" },
      { label: "About", href: "/who-we-are" },
      { label: "Articles", href: "/articles" },
    ],
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
    <footer className="border-t">
      <div className="container-page grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="max-w-sm text-h2">
            Cadogy <span className="serif-accent">builds anything.</span>
          </p>
          <p className="mt-5 max-w-sm text-muted-foreground">
            A senior software studio. Founded in {siteConfig.foundingYear} in{" "}
            {siteConfig.location.label}, working with clients everywhere.
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="mt-6 inline-flex min-h-11 items-center text-foreground underline-offset-4 hover:underline"
          >
            {siteConfig.email}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-meta">{column.title}</p>
              <ul className="mt-4 grid gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-10 items-center transition-colors hover:text-muted-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page flex flex-col-reverse items-start justify-between gap-4 border-t py-6 sm:flex-row sm:items-center">
        <p className="text-meta">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <ul className="-ml-3 flex items-center gap-1 sm:-mr-3 sm:ml-0">
          {socials.map(({ label, href, Icon }) => (
            <li key={href}>
              <a
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
              >
                <Icon className="size-[18px]" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
