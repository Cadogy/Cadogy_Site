import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"

import { compileArticle } from "../src/features/articles/authoring/compile"
import { coverArt } from "../src/features/articles/authoring/cover-art"
import { publishArticle } from "../src/features/articles/authoring/publish"
import { planTidy } from "../src/features/articles/authoring/tidy"
import { createWordPressClient } from "../src/features/articles/server/wordpress-client"

const say = (message: string) =>
  process.stdout.write(`${message}
`)

const CONTENT = "content/articles"
const REVALIDATE_URL =
  process.env.CONTENT_REVALIDATE_URL ??
  "https://www.cadogy.com/api/webhooks/content"
const PREVIEW = ".blog-preview"

const usage = `Usage:
  npm run blog -- preview [slug]         Check articles and images, write HTML into ${PREVIEW}/
  npm run blog -- publish <slug|--all>          Update posts, keeping their status (new posts start as drafts)
  npm run blog -- publish <slug|--all> --live   Update and publish
  npm run blog -- publish <slug|--all> --draft  Update and unpublish
  npm run blog -- tidy                          List unused topics, tags and images
  npm run blog -- tidy --apply                  Delete them`

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

const MAX_WIDTH = 3000

const toWebp = (file: Buffer) =>
  sharp(file)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 84, effort: 6 })
    .toBuffer()

const COVER = { width: 2400, height: 1350, cell: 40 }
const BACKGROUND = { r: 9, g: 10, b: 12 }

const MID_TONE = 84

const brandedCover = async (photo: Buffer, marks: readonly string[]) => {
  const { width, height, cell } = COVER
  const columns = Math.ceil(width / cell)
  const gray = await sharp(photo)
    .rotate()
    .resize(width, height, { fit: "cover", position: "attention" })
    .grayscale()
    .toBuffer()
  const { channels } = await sharp(gray).stats()
  const gain = Math.min(
    2,
    MID_TONE / Math.max(channels[0]?.mean ?? MID_TONE, 1)
  )
  const mono = await sharp(gray)
    .linear(gain * 1.1, -12)
    .tint({ r: 118, g: 130, b: 158 })
    .toBuffer()
  const grid = await sharp(mono)
    .resize(columns, Math.ceil(height / cell), { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer()
  const art = coverArt({
    ...COVER,
    marks: await Promise.all(
      marks.map((mark) =>
        readFile(join(CONTENT, "marks", `${mark}.svg`), "utf8")
      )
    ),
    shade: (column, row) => {
      const index = (row * columns + column) * 3
      return [grid[index] ?? 0, grid[index + 1] ?? 0, grid[index + 2] ?? 0]
    },
  })
  const faded = await sharp(mono)
    .composite([{ input: Buffer.from(art.fade), blend: "dest-in" }])
    .png()
    .toBuffer()
  return sharp({
    create: { width, height, channels: 3, background: BACKGROUND },
  })
    .composite([{ input: faded }, { input: Buffer.from(art.overlay) }])
    .png()
    .toBuffer()
}

const mediaFiles = async ({ media, meta }: Awaited<ReturnType<typeof load>>) =>
  Object.fromEntries(
    await Promise.all(
      media.map(async ({ path }) => {
        const source = await readFile(join(CONTENT, path))
        const branded =
          path === meta.cover.image && meta.cover.marks.length > 0
            ? await brandedCover(source, meta.cover.marks)
            : source
        return [path, new Uint8Array(await toWebp(branded))]
      })
    )
  )

const env = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is missing from .env.local`)
  return value
}

const preview = async (only?: string) => {
  await mkdir(PREVIEW, { recursive: true })
  for (const slug of await slugs(only)) {
    const article = await load(slug)
    const files = await mediaFiles(article)
    const cover = files[article.meta.cover.image]
    if (cover) await writeFile(join(PREVIEW, `${slug}-cover.webp`), cover)
    await writeFile(join(PREVIEW, `${slug}.html`), article.html)
    say(`✓ ${slug} (${article.meta.topic}) → ${PREVIEW}/`)
  }
}

const STATUS_FLAGS = { "--live": "publish", "--draft": "draft" } as const

const statusFrom = (flag?: string) =>
  flag === "--live" || flag === "--draft" ? STATUS_FLAGS[flag] : undefined

const refreshSite = async () => {
  const secret = process.env.CONTENT_REVALIDATE_SECRET?.trim()
  if (!secret) {
    say(
      "! CONTENT_REVALIDATE_SECRET is not set: the site refreshes within an hour"
    )
    return
  }
  const response = await fetch(REVALIDATE_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  })
  say(
    response.ok
      ? "✓ cadogy.com refreshed"
      : `! cadogy.com refresh failed (${response.status}): the site refreshes within an hour`
  )
}

const wordpress = () =>
  createWordPressClient({
    apiUrl: env("NEXT_PUBLIC_WP_API_URL"),
    username: env("WP_USERNAME"),
    password: env("WP_APP_PASSWORD"),
  })

const tidy = async (apply: boolean) => {
  const client = wordpress()
  const [categories, tags, media, posts, settings] = await Promise.all([
    client.listTerms("categories"),
    client.listTerms("tags"),
    client.listMedia(),
    client.listPosts(),
    client.siteSettings(),
  ])
  const plan = planTidy({ categories, tags, media, posts, ...settings })
  plan.categories.forEach((term) => say(`  topic  ${term.name}`))
  plan.tags.forEach((term) => say(`  tag    ${term.name}`))
  plan.media.forEach((item) => say(`  image  ${item.url.split("/").pop()}`))
  const total = plan.categories.length + plan.tags.length + plan.media.length
  if (total === 0) return say("✓ Nothing to tidy")
  if (!apply)
    return say(`${total} unused items. Run with --apply to delete them.`)
  for (const term of plan.categories)
    await client.deleteTerm("categories", term.id)
  for (const term of plan.tags) await client.deleteTerm("tags", term.id)
  for (const item of plan.media) await client.deleteMedia(item.id)
  say(`✓ Deleted ${total} unused items`)
  await refreshSite()
}

const publish = async (only: string | undefined, flag?: string) => {
  if (!only) throw new Error(usage)
  const client = wordpress()
  for (const slug of await slugs(only)) {
    const article = await load(slug)
    const result = await publishArticle({
      article,
      files: await mediaFiles(article),
      client,
      status: statusFrom(flag),
    })
    say(
      `✓ ${slug}: ${result.created ? "created" : "updated"} post ${result.id}`
    )
  }
  await refreshSite()
}

const main = async () => {
  process.loadEnvFile(".env.local")
  const [command, target, flag] = process.argv.slice(2)
  if (command === "preview") return preview(target)
  if (command === "publish") return publish(target, flag)
  if (command === "tidy") return tidy(target === "--apply")
  say(usage)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
