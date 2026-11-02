import {
  can,
  type Permission,
  type Role,
} from "@/features/auth/domain/permissions"

export type PortalNavItem = {
  readonly label: string
  readonly href: string
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
        exact: true,
        permission: "billing:read",
      },
      {
        label: "Invoices",
        href: "/admin/billing/invoices",
        permission: "billing:read",
      },
      {
        label: "Clients",
        href: "/admin/billing/clients",
        permission: "billing:read",
      },
      {
        label: "Services",
        href: "/admin/billing/catalog",
        permission: "billing:read",
      },
      {
        label: "Billing settings",
        href: "/admin/billing/settings",
        permission: "billing:write",
      },
      {
        label: "Inquiries",
        href: "/admin/inquiries",
        permission: "inquiries:read",
      },
      { label: "Tickets", href: "/admin/tickets", permission: "support:read" },
      { label: "Users", href: "/admin/users", permission: "users:read" },
      {
        label: "Security",
        href: "/admin/security",
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
        exact: true,
        permission: "portal:self",
      },
      {
        label: "Billing",
        href: "/dashboard/billing",
        permission: "portal:self",
      },
      {
        label: "Team",
        href: "/dashboard/team",
        permission: "portal:self",
      },
      {
        label: "Support",
        href: "/dashboard/tickets",
        permission: "portal:self",
      },
      { label: "Account", href: "/account", permission: "portal:self" },
    ],
  },
]

export const portalNavigation = (role: Role): PortalNavGroup[] =>
  GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(role, item.permission)),
  })).filter((group) => group.items.length > 0)
