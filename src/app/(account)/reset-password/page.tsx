import type { Metadata } from "next"
import Link from "next/link"
import { ResetPasswordForm } from "@/features/account/components/account-forms"
import { AuthCard, FormAlert } from "@/features/account/components/auth-card"

export const metadata: Metadata = { title: "Choose a new password" }

type Props = { searchParams: Promise<{ token?: string; error?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams
  return (
    <AuthCard title="Choose a new password">
      {token && !error ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="grid gap-4">
          <FormAlert>
            This reset link is invalid or has expired. Please request a new
            one.
          </FormAlert>
          <Link
            href="/forgot-password"
            className="text-sm font-medium underline underline-offset-4"
          >
            Request a new link
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
