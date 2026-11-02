export const ROLES = ["owner", "admin", "client"] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  client: "Client",
}

export const PERMISSIONS = [
  "portal:self",
  "billing:read",
  "billing:write",
  "support:read",
  "support:write",
  "inquiries:read",
  "inquiries:write",
  "users:read",
  "users:manage",
  "users:assign-roles",
  "security:read",
  "security:impersonate",
] as const

export type Permission = (typeof PERMISSIONS)[number]

const STUDIO: readonly Permission[] = [
  "portal:self",
  "billing:read",
  "billing:write",
  "support:read",
  "support:write",
  "inquiries:read",
  "inquiries:write",
  "users:read",
  "users:manage",
]

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: STUDIO,
  client: ["portal:self"],
}

export const permissionsFor = (role: Role): readonly Permission[] =>
  MATRIX[role]

export const can = (
  role: Role | null | undefined,
  permission: Permission
): boolean => (role ? MATRIX[role].includes(permission) : false)

export const isStaff = (role: Role) => role === "owner" || role === "admin"

export const toRole = (value: unknown): Role =>
  ROLES.find((role) => role === value) ?? "client"
