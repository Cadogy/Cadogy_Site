import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard } from "@/features/account/components/auth-card"
import { TwoFactorForm } from "@/features/account/components/two-factor-form"

import { safeCallbackPath } from "@/lib/auth/safe-redirect"

export const metadata: Metadata = { title: "Two-factor authentication" }

type Props = { searchParams: Promise<{ callbackUrl?: string }> }

export default async function VerifyTwoFactorPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams
  return (
    <AuthCard
      title="Confirm it's you"
      description="Your account uses two-factor authentication."
      footer={
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <TwoFactorForm callbackPath={safeCallbackPath(callbackUrl)} />
    </AuthCard>
  )
}
