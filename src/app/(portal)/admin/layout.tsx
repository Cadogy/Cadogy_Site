import { requireStaff } from "@/features/auth/server/session"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireStaff()
  return children
}
