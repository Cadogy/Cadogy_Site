import {
  can,
  type Permission,
  type Role,
} from "@/features/auth/domain/permissions"

export const SIDEBAR_COOKIE = "portal-sidebar"

export type NavIcon =
  | "overview"
  | "invoices"
  | "clients"
  | "credit-notes"
  | "services"
  | "settings"
  | "inquiries"
  | "tickets"
  | "users"
  | "security"
  | "dashboard"
  | "billing"
  | "team"
  | "support"
  | "account"

export type PortalNavItem = {
  readonly label: string
  readonly href: string
  readonly icon: NavIcon
  readonly exact?: boolean
  readonly permission: Permission
}

export type PortalNavGroup = {
  readonly label: string
  readonly items: readonly PortalNavItem[]
}

const GROUPS: readonly PortalNavGroup[] = [
  {
    label: "Studio",
    items: [
      {
        label: "Overview",
        href: "/admin",
        icon: "overview",
        exact: true,
        permission: "billing:read",
      },
      {
        label: "Invoices",
        href: "/admin/billing/invoices",
        icon: "invoices",
        permission: "billing:read",
      },
      {
        label: "Clients",
        href: "/admin/billing/clients",
        icon: "clients",
        permission: "billing:read",
      },
      {
        label: "Credit notes",
        href: "/admin/billing/credit-notes",
        icon: "credit-notes",
        permission: "billing:read",
      },
      {
        label: "Services",
        href: "/admin/billing/catalog",
        icon: "services",
        permission: "billing:read",
      },
      {
        label: "Billing settings",
        href: "/admin/billing/settings",
        icon: "settings",
        permission: "billing:write",
      },
      {
        label: "Inquiries",
        href: "/admin/inquiries",
        icon: "inquiries",
        permission: "inquiries:read",
      },
      {
        label: "Tickets",
        href: "/admin/tickets",
        icon: "tickets",
        permission: "support:read",
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: "users",
        permission: "users:read",
      },
      {
        label: "Security",
        href: "/admin/security",
        icon: "security",
        permission: "security:read",
      },
    ],
  },
  {
    label: "My account",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        exact: true,
        permission: "portal:self",
      },
      {
        label: "Billing",
        href: "/dashboard/billing",
        icon: "billing",
        permission: "portal:self",
      },
      {
        label: "Team",
        href: "/dashboard/team",
        icon: "team",
        permission: "portal:self",
      },
      {
        label: "Support",
        href: "/dashboard/tickets",
        icon: "support",
        permission: "portal:self",
      },
      {
        label: "Account",
        href: "/account",
        icon: "account",
        permission: "portal:self",
      },
    ],
  },
]

export const portalNavigation = (role: Role): PortalNavGroup[] =>
  GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(role, item.permission)),
  })).filter((group) => group.items.length > 0)
