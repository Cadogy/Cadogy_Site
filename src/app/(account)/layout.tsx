import type { Metadata } from "next"
import Link from "next/link"

import { SignalGrid } from "@/components/media/signal-grid"
import { Logo } from "@/components/site/logo"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between px-5 md:px-8 xl:px-12">
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
          className="flex flex-1 items-start justify-center px-5 pt-10 pb-16 sm:items-center sm:py-12 md:px-8"
        >
          {children}
        </main>
      </div>
      <div className="relative hidden border-l bg-card lg:block">
        <div className="sticky top-0 isolate h-dvh overflow-hidden">
          <SignalGrid className="-z-10 [mask-image:linear-gradient(to_bottom,transparent_15%,black_70%)]" />
          <p className="max-w-xl p-12 text-h2">
            Invoices, payments and support,{" "}
            <span className="text-muted-foreground">in one place.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
