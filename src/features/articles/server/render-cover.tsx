import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { CoverArt } from "../components/cover-art"

const font = (file: string) =>
  readFile(
    join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file)
  )

export const COVER_SIZE = { width: 1600, height: 900 } as const
export const SHARE_SIZE = { width: 1200, height: 630 } as const

export const renderCover = async ({
  slug,
  topic,
  title,
  size,
}: {
  slug: string
  topic: string
  title?: string
  size: { readonly width: number; readonly height: number }
}) => {
  const [regular, medium] = await Promise.all([
    font("Geist-Regular.ttf"),
    font("Geist-Medium.ttf"),
  ])
  return new ImageResponse(
    <CoverArt slug={slug} topic={topic} title={title} {...size} />,
    {
      ...size,
      fonts: [
        { name: "Geist", data: regular, weight: 400 },
        { name: "Geist", data: medium, weight: 500 },
      ],
    }
  )
}
