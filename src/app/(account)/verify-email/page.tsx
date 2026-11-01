import type { Metadata } from "next"
import Link from "next/link"
import { VerifyEmailForm } from "@/features/account/components/account-forms"
import { AuthCard, FormAlert } from "@/features/account/components/auth-card"

export const metadata: Metadata = { title: "Verify your email" }

type Props = { searchParams: Promise<{ token?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams
  return (
    <AuthCard
      title="Verify your email"
      description="Confirm this is your email address to finish setting up your account."
    >
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <div className="grid gap-4">
          <FormAlert>This verification link is incomplete.</FormAlert>
          <Link
            href="/login"
            className="text-sm font-medium underline underline-offset-4"
          >
            Sign in to request a new one
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
