import { Logo } from "@/components/site/logo"

const bar = "rounded-full bg-foreground/8 motion-safe:animate-pulse"

/** The page area while it loads: a title and a couple of sections. */
export function PortalContentSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-10">
      <span className="sr-only">Loading</span>
      <div className="grid gap-3">
        <div className={`${bar} h-9 w-56`} />
        <div className={`${bar} h-4 w-80 max-w-full`} />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="grid gap-3 border-t pt-8">
          <div className={`${bar} h-5 w-40`} />
          <div className={`${bar} h-4 w-full max-w-2xl`} />
          <div className={`${bar} h-4 w-2/3 max-w-xl`} />
        </div>
      ))}
    </div>
  )
}

/**
 * The portal's layout before the session is known: sidebar, header and a
 * content placeholder, so the page never flashes an empty screen.
 */
export function PortalSkeleton() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r lg:flex lg:flex-col">
        <div className="flex h-16 shrink-0 items-center pl-5">
          <Logo />
        </div>
        <div className="grid gap-2 px-3 py-4" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className={`${bar} h-9`} />
          ))}
        </div>
      </aside>
      <div className="min-w-0">
        <header className="lg:hidden">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <Logo />
          </div>
        </header>
        <main className="container-portal py-8 lg:py-12">
          <PortalContentSkeleton />
        </main>
      </div>
    </div>
  )
}
