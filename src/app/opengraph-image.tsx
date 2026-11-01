import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { siteConfig } from "@/config/site"

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const font = (file: string) =>
  readFile(
    join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file)
  )

export default async function OpengraphImage() {
  const [medium, regular] = await Promise.all([
    font("Geist-Medium.ttf"),
    font("Geist-Regular.ttf"),
  ])

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#0a0a0b",
        color: "#f2f1ec",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 32,
          fontWeight: 500,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#f2f1ec">
          <path d="M19.4491 6.94063V9.45062C19.4491 10.1606 18.7291 10.6206 18.0591 10.3706C17.2191 10.0606 16.2891 9.94062 15.3091 10.0406C12.9291 10.3006 10.4891 12.5906 10.0891 14.9606C9.75906 16.9306 10.3891 18.7706 11.5991 20.0706C12.1491 20.6706 11.7791 21.6406 10.9691 21.7306C10.2791 21.8106 9.59906 21.7906 9.21906 21.5106L3.71906 17.4006C3.06906 16.9106 2.53906 15.8506 2.53906 15.0306V6.94063C2.53906 5.81063 3.39906 4.57063 4.44906 4.17063L9.94906 2.11062C10.5191 1.90063 11.4591 1.90063 12.0291 2.11062L17.5291 4.17063C18.5891 4.57063 19.4491 5.81063 19.4491 6.94063Z" />
          <path d="M16 11.5117C13.52 11.5117 11.5 13.5317 11.5 16.0117C11.5 18.4917 13.52 20.5117 16 20.5117C18.48 20.5117 20.5 18.4917 20.5 16.0117C20.5 13.5217 18.48 11.5117 16 11.5117Z" />
          <circle cx="21" cy="21" r="1" />
        </svg>
        Cadogy
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 88,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          We can build anything.
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#9b9a94",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Senior software studio for web apps, marketplaces, payments and the
          systems behind them.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          color: "#9b9a94",
        }}
      >
        <span>cadogy.com</span>
        <span>South Florida · Est. {siteConfig.foundingYear}</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: medium, weight: 500, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    }
  )
}
