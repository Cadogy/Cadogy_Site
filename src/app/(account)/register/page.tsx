import type { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "@/features/account/components/account-forms"
import { AuthCard } from "@/features/account/components/auth-card"

import { env } from "@/env"

export const metadata: Metadata = { title: "Create a client account" }

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Use the email address your invoices are sent to and they will appear in your dashboard automatically."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </AuthCard>
  )
}
