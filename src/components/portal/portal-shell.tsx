"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Role } from "@/features/auth/domain/permissions"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/site/logo"

import { ImpersonationBanner } from "./impersonation-banner"
import type { PortalNavGroup, PortalNavItem } from "./navigation"
import { UserMenu } from "./user-menu"

type ShellUser = {
  readonly name: string
  readonly email: string
  readonly role: Role
}

const isActive = (pathname: string, item: PortalNavItem) =>
  item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)

function NavGroups({
  groups,
  label,
  onNavigate,
  large = false,
}: {
  groups: readonly PortalNavGroup[]
  label: string
  onNavigate?: () => void
  large?: boolean
}) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="grid gap-6">
      {groups.map((group) => (
        <div key={group.label} className="grid gap-1">
          <h2 className="px-3 pb-1 text-meta">{group.label}</h2>
          {group.items.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-full px-3 transition-colors",
                  large ? "text-lg" : "text-sm",
                  active
                    ? "bg-foreground/[0.08] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function MobileMenu({ groups }: { groups: readonly PortalNavGroup[] }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="flex h-dvh flex-col gap-0 overflow-y-auto border-0 bg-background p-0"
      >
        <div className="flex h-16 items-center px-5">
          <SheetTitle className="text-meta font-normal">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Portal navigation
          </SheetDescription>
        </div>
        <div className="px-3 pb-10">
          <NavGroups
            groups={groups}
            label="Portal menu"
            onNavigate={() => setOpen(false)}
            large
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function PortalShell({
  groups,
  user,
  impersonating,
  onStopImpersonating,
  children,
}: {
  groups: readonly PortalNavGroup[]
  user: ShellUser
  impersonating?: boolean
  onStopImpersonating?: () => Promise<void>
  children: React.ReactNode
}) {
  return (
    <>
      {impersonating && onStopImpersonating ? (
        <ImpersonationBanner email={user.email} onStop={onStopImpersonating} />
      ) : null}
      <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
        <aside className="sticky top-0 hidden h-dvh border-r lg:flex lg:flex-col">
          <div className="flex h-16 shrink-0 items-center px-5">
            <Logo href="/" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavGroups groups={groups} label="Portal" />
          </div>
          <div className="border-t p-3">
            <UserMenu user={user} variant="row" />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm lg:hidden">
            <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6">
              <Logo href="/" />
              <div className="flex items-center gap-1">
                <UserMenu user={user} />
                <MobileMenu groups={groups} />
              </div>
            </div>
          </header>
          <main
            id="main"
            className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
          >
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export function PortalPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
