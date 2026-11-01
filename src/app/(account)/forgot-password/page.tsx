import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "@/features/account/components/account-forms"
import { AuthCard } from "@/features/account/components/auth-card"

import { env } from "@/env"

export const metadata: Metadata = { title: "Reset your password" }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send you a link to choose a new password."
      footer={
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
    </AuthCard>
  )
}
