import type { Metadata } from "next"
import { can, ROLE_LABELS } from "@/features/auth/domain/permissions"
import { requirePermission } from "@/features/auth/server/session"
import { formatDate } from "@/features/billing/domain/format"
import { listUsers } from "@/features/users/actions"
import { RoleSelect } from "@/features/users/role-select"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Users" }

export default async function UsersPage() {
  const viewer = await requirePermission("users:read", "/admin/users")
  const users = await listUsers()
  const canAssignRoles = can(viewer.role, "users:assign-roles")

  return (
    <>
      <PortalPageHeader
        title="Users"
        description="Everyone with an account. Role changes take effect immediately."
      />
      <ul className="divide-y border-y">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name || user.email}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.name ? `${user.email} · ` : ""}
                {ROLE_LABELS[user.role]} ·{" "}
                {user.verified ? "Verified" : "Unverified"}
                {user.banned ? " · Banned" : ""} · Joined{" "}
                {formatDate(user.createdAt)}
              </p>
            </div>
            {user.id === viewer.id ? (
              <span className="text-sm text-muted-foreground">You</span>
            ) : canAssignRoles ? (
              <RoleSelect
                userId={user.id}
                email={user.email}
                role={user.role}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </>
  )
}
