"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { authClient } from "@/features/auth/client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/site/logo"

export type PortalNavItem = {
  readonly label: string
  readonly href: string
  readonly exact?: boolean
}

const isActive = (pathname: string, item: PortalNavItem) =>
  item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)

export function PortalShell({
  area,
  nav,
  user,
  children,
}: {
  area: string
  nav: readonly PortalNavItem[]
  user: { readonly email: string; readonly name: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await authClient.signOut()
    router.replace("/")
    router.refresh()
  }

  const links = (orientation: "row" | "column") =>
    nav.map((item) => {
      const active = isActive(pathname, item)
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors",
            active
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            orientation === "column" && "w-full"
          )}
        >
          {item.label}
        </Link>
      )
    })

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <Logo href="/" />
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            {area}
          </span>
        </div>
        <nav aria-label={`${area} navigation`} className="grid gap-1 p-3">
          {links("column")}
        </nav>
        <div className="mt-auto border-t p-4">
          <p className="truncate text-sm font-medium">
            {user.name || user.email}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            className="mt-2 -ml-3 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm lg:hidden">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Logo href="/" />
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {area}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <nav
            aria-label={`${area} navigation`}
            className="flex scrollbar-none gap-1 overflow-x-auto px-3 pb-2 sm:px-5"
          >
            {links("row")}
          </nav>
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
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
