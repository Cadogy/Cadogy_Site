import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

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
          className="flex flex-1 items-start justify-center px-5 pt-10 pb-16 sm:items-center sm:pt-0 md:px-8"
        >
          {children}
        </main>
      </div>
      <div className="relative hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <Image
            src="/images/studio/infrastructure.webp"
            alt="Florida's coastline at night, seen from orbit"
            fill
            sizes="(min-width: 1024px) 50vw, 1px"
            quality={85}
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 media-scrim" />
          <p className="absolute right-12 bottom-12 left-12 text-statement text-white">
            Invoices, payments and support,{" "}
            <span className="serif-accent text-white/80">in one place.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
