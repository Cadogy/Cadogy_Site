import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="container-page flex min-h-[60dvh] flex-col items-start justify-center py-24"
      >
        <p className="text-meta">404</p>
        <h1 className="mt-3 text-h1">This page doesn&apos;t exist.</h1>
        <p className="mt-4 max-w-xl text-lead">
          The link may be broken or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/articles">Read our articles</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
