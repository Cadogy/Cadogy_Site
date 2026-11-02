import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard, FormAlert } from "@/features/account/components/auth-card"
import { LoginForm } from "@/features/account/components/login-form"

import { env } from "@/env"
import { safeCallbackPath } from "@/lib/auth/safe-redirect"

export const metadata: Metadata = { title: "Sign in" }

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams
  return (
    <AuthCard
      title="Sign in"
      description="Your invoices, payments and support requests."
      footer={
        <>
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-5">
          <FormAlert>Please sign in again to continue.</FormAlert>
        </div>
      ) : null}
      <LoginForm
        callbackPath={safeCallbackPath(callbackUrl)}
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
    </AuthCard>
  )
}
