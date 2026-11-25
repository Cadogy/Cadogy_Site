import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"

import { compileArticle } from "../src/features/articles/authoring/compile"
import { publishArticle } from "../src/features/articles/authoring/publish"
import {
  COVER_SIZE,
  renderCover,
} from "../src/features/articles/server/render-cover"
import { createWordPressClient } from "../src/features/articles/server/wordpress-client"

const say = (message: string) =>
  process.stdout.write(`${message}
`)

const CONTENT = "content/articles"
const PREVIEW = ".blog-preview"

const usage = `Usage:
  npm run blog -- preview [slug]         Render covers and HTML into ${PREVIEW}/
  npm run blog -- publish <slug|--all>          Update posts, keeping their status (new posts start as drafts)
  npm run blog -- publish <slug|--all> --live   Update and publish
  npm run blog -- publish <slug|--all> --draft  Update and unpublish`

const slugs = async (only?: string) => {
  const files = (await readdir(CONTENT)).filter(
    (file) => file.endsWith(".md") && file !== "README.md"
  )
  const all = files.map((file) => file.replace(/\.md$/, ""))
  if (!only || only === "--all") return all
  if (!all.includes(only)) throw new Error(`No ${CONTENT}/${only}.md`)
  return [only]
}

const load = async (slug: string) =>
  compileArticle(await readFile(join(CONTENT, `${slug}.md`), "utf8"), slug)

const coverWebp = async (slug: string, topic: string) => {
  const png = await renderCover({ slug, topic, size: COVER_SIZE })
  return sharp(Buffer.from(await png.arrayBuffer()))
    .webp({ quality: 88 })
    .toBuffer()
}

const env = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is missing from .env.local`)
  return value
}

const preview = async (only?: string) => {
  await mkdir(PREVIEW, { recursive: true })
  for (const slug of await slugs(only)) {
    const article = await load(slug)
    await writeFile(
      join(PREVIEW, `${slug}.webp`),
      await coverWebp(slug, article.meta.topic)
    )
    await writeFile(join(PREVIEW, `${slug}.html`), article.html)
    say(`✓ ${slug} (${article.meta.topic}) → ${PREVIEW}/`)
  }
}

const STATUS_FLAGS = { "--live": "publish", "--draft": "draft" } as const

const statusFrom = (flag?: string) =>
  flag === "--live" || flag === "--draft" ? STATUS_FLAGS[flag] : undefined

const publish = async (only: string | undefined, flag?: string) => {
  if (!only) throw new Error(usage)
  const client = createWordPressClient({
    apiUrl: env("NEXT_PUBLIC_WP_API_URL"),
    username: env("WP_USERNAME"),
    password: env("WP_APP_PASSWORD"),
  })
  for (const slug of await slugs(only)) {
    const article = await load(slug)
    const result = await publishArticle({
      article,
      cover: await coverWebp(slug, article.meta.topic),
      client,
      status: statusFrom(flag),
    })
    say(
      `✓ ${slug}: ${result.created ? "created" : "updated"} post ${result.id}`
    )
  }
}

const main = async () => {
  process.loadEnvFile(".env.local")
  const [command, target, flag] = process.argv.slice(2)
  if (command === "preview") return preview(target)
  if (command === "publish") return publish(target, flag)
  say(usage)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
