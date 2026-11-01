import type { Metadata } from "next"
import { formatDate } from "@/features/billing/domain/format"
import { listUsers } from "@/features/users/actions"
import { RoleToggle } from "@/features/users/role-toggle"

import { requireAdmin } from "@/lib/auth/session"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Users" }

export default async function UsersPage() {
  const [admin, users] = await Promise.all([requireAdmin(), listUsers()])
  return (
    <>
      <PortalPageHeader title="Users" description="Client portal accounts." />
      <ul className="divide-y overflow-hidden rounded-xl border">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name || user.email}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.name ? `${user.email} · ` : ""}
                {user.role === "admin" ? "Admin" : "Client"} ·{" "}
                {user.verified ? "Verified" : "Unverified"} · Joined{" "}
                {formatDate(user.createdAt)}
              </p>
            </div>
            <RoleToggle
              userId={user.id}
              role={user.role}
              isSelf={user.id === admin.id}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
