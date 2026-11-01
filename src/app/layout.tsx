import "@/styles/globals.css"

import type { Metadata, Viewport } from "next"
import { Instrument_Serif } from "next/font/google"
import { AppProviders } from "@/providers/app-providers"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import { env } from "@/env"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

const defaultTitle = `${siteConfig.name} — ${siteConfig.tagline}`

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: defaultTitle, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: siteConfig.founders.map((founder) => ({ name: founder.name })),
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    url: "/",
    title: defaultTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.description,
  },
  icons: { icon: "/favicon.ico", apple: "/favicon.ico" },
  verification: env.GOOGLE_SITE_VERIFICATION
    ? { google: env.GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.variable, GeistMono.variable, serif.variable)}
    >
      <body className="min-h-dvh bg-background font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
