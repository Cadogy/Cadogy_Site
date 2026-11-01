"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { AccountLink } from "./account-link"
import { Logo } from "./logo"
import { NavLink } from "./nav-link"

function MobileMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="flex h-dvh flex-col gap-0 border-0 bg-background p-0"
      >
        <div className="flex h-16 items-center px-5">
          <SheetTitle className="text-meta font-normal">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </div>
        <nav
          aria-label="Mobile"
          className="flex flex-1 flex-col justify-center px-5"
        >
          {siteConfig.nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onNavigate={close}
              className="py-2 text-[2.5rem] leading-tight font-medium tracking-[-0.03em] text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="text-foreground"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="grid gap-3 p-5 pb-8">
          <Button asChild size="lg">
            <Link href="/contact" onClick={close}>
              Start a project
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <AccountLink onNavigate={close} />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled ? "bg-background/75 backdrop-blur-xl" : "bg-background"
      )}
    >
      <div className="container-page grid h-16 grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeClassName="text-foreground"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center justify-end gap-1 lg:flex">
          <AccountLink className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground" />
          <Button asChild size="sm">
            <Link href="/contact">Start a project</Link>
          </Button>
        </div>
        <div className="flex justify-end lg:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
