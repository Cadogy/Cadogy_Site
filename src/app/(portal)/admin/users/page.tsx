import type { Metadata } from "next"
import { can, ROLE_LABELS, ROLES } from "@/features/auth/domain/permissions"
import { requirePermission } from "@/features/auth/server/session"
import { formatDate } from "@/features/billing/domain/format"
import { listUsers } from "@/features/users/actions"
import { RoleSelect } from "@/features/users/role-select"
import { UserActions } from "@/features/users/user-actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Users" }

type Props = {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>
}

export default async function UsersPage({ searchParams }: Props) {
  const viewer = await requirePermission("users:read", "/admin/users")
  const filter = await searchParams
  const users = await listUsers(filter)
  const canAssignRoles = can(viewer.role, "users:assign-roles")

  return (
    <>
      <PortalPageHeader
        title="Users"
        description="Everyone with an account. Changes take effect immediately."
      />

      <form
        role="search"
        className="mb-8 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <label htmlFor="user-search" className="sr-only">
          Search by name or email
        </label>
        <Input
          id="user-search"
          name="q"
          type="search"
          defaultValue={filter.q}
          placeholder="Search by name or email"
        />
        <label htmlFor="user-role" className="sr-only">
          Role
        </label>
        <NativeSelect
          id="user-role"
          name="role"
          defaultValue={filter.role ?? ""}
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </NativeSelect>
        <label htmlFor="user-status" className="sr-only">
          Status
        </label>
        <NativeSelect
          id="user-status"
          name="status"
          defaultValue={filter.status ?? ""}
        >
          <option value="">Any status</option>
          <option value="banned">Banned</option>
          <option value="unverified">Unverified</option>
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {users.length === 0 ? (
        <p className="border-t pt-6 text-muted-foreground">
          No one matches those filters.
        </p>
      ) : (
        <ul className="divide-y border-y">
          {users.map((user) => (
            <li
              key={user.id}
              className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.name || user.email}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.name ? `${user.email} · ` : ""}
                  {ROLE_LABELS[user.role]} ·{" "}
                  {user.verified ? "Verified" : "Unverified"} ·{" "}
                  {user.twoFactor ? "Two-factor on" : "Two-factor off"} · Joined{" "}
                  {formatDate(user.createdAt)}
                </p>
                {user.banned ? (
                  <p className="mt-1 text-sm text-destructive">
                    Banned{user.banReason ? `: ${user.banReason}` : ""}
                  </p>
                ) : null}
              </div>
              {user.id === viewer.id ? (
                <span className="text-sm text-muted-foreground">You</span>
              ) : (
                <div className="grid gap-3 lg:justify-items-end">
                  {canAssignRoles ? (
                    <RoleSelect
                      userId={user.id}
                      email={user.email}
                      role={user.role}
                    />
                  ) : null}
                  <UserActions
                    userId={user.id}
                    email={user.email}
                    actions={user.actions}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
