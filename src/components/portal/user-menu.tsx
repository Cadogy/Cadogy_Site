"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/features/auth/client"
import {
  isStaff,
  ROLE_LABELS,
  type Role,
} from "@/features/auth/domain/permissions"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { LayoutDashboard, LogOut, ShieldCheck, Wrench } from "lucide-react"

import { cn } from "@/lib/utils"

type MenuUser = {
  readonly name: string
  readonly email: string
  readonly role: Role
}

const initialsOf = ({ name, email }: MenuUser) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length
    ? words.slice(0, 2).map((word) => word[0])
    : [email[0] ?? "?"]
  return letters.join("").toUpperCase()
}

const itemClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm outline-none data-[highlighted]:bg-foreground/[0.06]"

function Avatar({ user }: { user: MenuUser }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.1] text-xs font-medium tracking-wide"
    >
      {initialsOf(user)}
    </span>
  )
}

export function UserMenu({
  user,
  variant = "avatar",
}: {
  user: MenuUser
  variant?: "avatar" | "row"
}) {
  const router = useRouter()
  const staff = isStaff(user.role)

  const signOut = async () => {
    await authClient.signOut()
    router.replace("/")
    router.refresh()
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account menu for ${user.name || user.email}`}
        className={cn(
          "flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variant === "avatar"
            ? "size-11 justify-center"
            : "min-h-11 w-full px-2 py-1.5 text-left hover:bg-foreground/[0.06]"
        )}
      >
        <Avatar user={user} />
        {variant === "row" ? (
          <span className="grid min-w-0">
            <span className="truncate text-sm font-medium">
              {user.name || user.email}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
        ) : null}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-72 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-lg outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar user={user} />
            <div className="grid min-w-0 gap-0.5">
              <span className="truncate text-sm font-medium">
                {user.name || user.email}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            {staff ? (
              <span className="ml-auto rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            ) : null}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
          </DropdownMenu.Item>
          {staff ? (
            <DropdownMenu.Item asChild className={itemClass}>
              <Link href="/admin">
                <Wrench className="size-4" aria-hidden="true" />
                Studio
              </Link>
            </DropdownMenu.Item>
          ) : null}
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/account">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Account and security
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item className={itemClass} onSelect={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
