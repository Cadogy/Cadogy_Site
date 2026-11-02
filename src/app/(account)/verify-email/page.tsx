import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard, FormAlert } from "@/features/account/components/auth-card"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Verify your email" }

type Props = { searchParams: Promise<{ error?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { error } = await searchParams
  if (error) {
    return (
      <AuthCard
        title="This link didn't work"
        description="Verification links expire after 24 hours and can only be used once."
      >
        <div className="grid gap-4">
          <FormAlert>
            Sign in with your email and password and we&apos;ll send you a
            fresh link.
          </FormAlert>
          <Button asChild size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </AuthCard>
    )
  }
  return (
    <AuthCard
      title="Your email is verified"
      description="Your account is ready."
    >
      <Button asChild size="lg">
        <Link href="/dashboard">Go to your dashboard</Link>
      </Button>
    </AuthCard>
  )
}
