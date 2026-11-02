"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Role } from "@/features/auth/domain/permissions"
import {
  BadgePercent,
  CircleUser,
  CreditCard,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Menu,
  MessagesSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

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
import {
  SIDEBAR_COOKIE,
  type NavIcon,
  type PortalNavGroup,
  type PortalNavItem,
} from "./navigation"
import { UserMenu } from "./user-menu"

type ShellUser = {
  readonly name: string
  readonly email: string
  readonly role: Role
}

const ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutGrid,
  invoices: FileText,
  clients: Users,
  "credit-notes": BadgePercent,
  services: Package,
  settings: Settings,
  inquiries: Inbox,
  tickets: MessagesSquare,
  users: UserRound,
  security: Shield,
  dashboard: LayoutDashboard,
  billing: CreditCard,
  team: UsersRound,
  support: LifeBuoy,
  account: CircleUser,
}

const isActive = (pathname: string, item: PortalNavItem) =>
  item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)

function NavGroups({
  groups,
  label,
  onNavigate,
  collapsed = false,
  large = false,
}: {
  groups: readonly PortalNavGroup[]
  label: string
  onNavigate?: () => void
  collapsed?: boolean
  large?: boolean
}) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="grid gap-6">
      {groups.map((group) => (
        <div key={group.label} className="grid gap-0.5">
          <h2 className={cn("px-3 pb-1 text-meta", collapsed && "sr-only")}>
            {group.label}
          </h2>
          {group.items.map((item) => {
            const active = isActive(pathname, item)
            const Icon = ICONS[item.icon]
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full px-3 transition-colors",
                  large ? "text-lg" : "text-sm",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-foreground/8 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
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
      <SheetContent className="overflow-y-auto">
        <div className="flex h-16 shrink-0 items-center px-5">
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

const useSidebar = (initiallyCollapsed: boolean) => {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed)

  const toggle = useCallback(() => setCollapsed((current) => !current), [])

  useEffect(() => {
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`
  }, [collapsed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b") return
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  return { collapsed, toggle }
}

export function PortalShell({
  groups,
  user,
  impersonating,
  onStopImpersonating,
  sidebarCollapsed = false,
  children,
}: {
  groups: readonly PortalNavGroup[]
  user: ShellUser
  impersonating?: boolean
  onStopImpersonating?: () => Promise<void>
  sidebarCollapsed?: boolean
  children: React.ReactNode
}) {
  const { collapsed, toggle } = useSidebar(sidebarCollapsed)
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <>
      {impersonating && onStopImpersonating ? (
        <ImpersonationBanner email={user.email} onStop={onStopImpersonating} />
      ) : null}
      <div
        className={cn(
          "min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-200 lg:ease-out",
          collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[256px_1fr]"
        )}
      >
        <aside
          id="portal-sidebar"
          className="sticky top-0 hidden h-dvh overflow-hidden border-r lg:flex lg:flex-col"
        >
          <div
            className={cn(
              "flex h-16 shrink-0 items-center gap-2",
              collapsed ? "justify-center" : "justify-between pr-2 pl-5"
            )}
          >
            {collapsed ? null : <Logo href="/" />}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-controls="portal-sidebar"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+B)`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ToggleIcon className="size-[18px]" aria-hidden="true" />
            </Button>
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4">
            <NavGroups groups={groups} label="Portal" collapsed={collapsed} />
          </div>
          <div
            className={cn("border-t p-3", collapsed && "flex justify-center")}
          >
            <UserMenu user={user} variant={collapsed ? "avatar" : "row"} />
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
          <main id="main" className="container-portal py-8 lg:py-12">
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
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-2">
        <h1 className="text-title">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </div>
  )
}
