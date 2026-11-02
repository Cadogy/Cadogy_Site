import { professionalServiceSchema } from "@/lib/seo/structured-data"
import { JsonLd } from "@/components/seo/json-ld"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-background focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <JsonLd data={professionalServiceSchema()} />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
