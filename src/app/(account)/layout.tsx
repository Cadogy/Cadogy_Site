import type { Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/site/logo"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-16 items-center justify-between">
        <Logo />
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          Back to site
        </Link>
      </header>
      <main
        id="main"
        className="flex flex-1 items-start justify-center px-5 pt-8 pb-16 sm:items-center sm:pt-0"
      >
        {children}
      </main>
    </div>
  )
}
