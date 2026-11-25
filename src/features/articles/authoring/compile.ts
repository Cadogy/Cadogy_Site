import matter from "gray-matter"
import { Marked } from "marked"
import { z } from "zod"

import { highlightCode } from "./highlight"

const coverSchema = z.object({
  image: z.string().min(1),
  alt: z.string().min(1),
  credit: z.string().min(1).optional(),
  creditUrl: z.url().optional(),
  marks: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
})

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  topic: z.string().min(1).default("General"),
  author: z.string().regex(/^[a-z0-9-]+$/),
  tags: z.array(z.string().min(1)).default([]),
  cover: coverSchema,
})

const figureSchema = z.object({
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
  credit: z.string().min(1).optional(),
})

type ArticleMeta = {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly topic: string
  readonly author: string
  readonly tags: readonly string[]
  readonly cover: z.infer<typeof coverSchema>
}

type MediaReference = { readonly path: string; readonly alt: string }

export type CompiledArticle = {
  readonly meta: ArticleMeta
  readonly html: string
  readonly media: readonly MediaReference[]
}

const BLOCKS = {
  summary: "aside",
  callout: "aside",
  sources: "aside",
  faq: "section",
  figure: "figure",
  youtube: "figure",
} as const

type BlockName = keyof typeof BLOCKS

const isBlockName = (name: string): name is BlockName => name in BLOCKS

const YOUTUBE_ID = /^[\w-]{11}$/

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

const slugifyHeading = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")

const createMarkdown = () => {
  const seen = new Map<string, number>()
  const uniqueId = (text: string) => {
    const base = slugifyHeading(text) || "section"
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  }
  return new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        return `<h${depth} id="${uniqueId(text)}">${text}</h${depth}>\n`
      },
      code({ text, lang }) {
        return `${highlightCode(text, lang?.trim().split(/\s+/)[0])}\n`
      },
    },
  })
}

type Segment =
  | { readonly kind: "markdown"; readonly text: string }
  | {
      readonly kind: "block"
      readonly name: BlockName
      readonly argument?: string
      readonly text: string
    }

const OPEN = /^:::([a-z]+)(?:\s+(\S+))?\s*$/
const CLOSE = /^:::\s*$/

const segment = (body: string): readonly Segment[] => {
  const lines = body.split(/\r?\n/)
  const result: Segment[] = []
  const buffer: string[] = []
  const flush = () => {
    if (buffer.length > 0)
      result.push({ kind: "markdown", text: buffer.splice(0).join("\n") })
  }
  for (let index = 0; index < lines.length; index++) {
    const open = OPEN.exec(lines[index] ?? "")
    if (!open) {
      buffer.push(lines[index] ?? "")
      continue
    }
    const name = open[1] ?? ""
    if (!isBlockName(name)) throw new Error(`Unknown block ":::${name}"`)
    const end = lines.findIndex(
      (line, position) => position > index && CLOSE.test(line)
    )
    if (end < 0) throw new Error(`Block ":::${name}" is never closed`)
    flush()
    result.push({
      kind: "block",
      name,
      argument: open[2],
      text: lines.slice(index + 1, end).join("\n"),
    })
    index = end
  }
  flush()
  return result
}

const fields = (text: string) =>
  Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => /^(\w+):\s*(.+)$/.exec(line.trim()))
      .flatMap((match) => (match ? [[match[1], match[2]]] : []))
  )

const renderFigure = (path: string | undefined, text: string) => {
  if (!path) throw new Error(`":::figure" needs an image path`)
  const parsed = figureSchema.safeParse(fields(text))
  if (!parsed.success) throw new Error(`":::figure ${path}" needs alt text`)
  const { alt, caption, credit } = parsed.data
  const captionParts = [
    caption ? escapeHtml(caption) : "",
    credit ? `<span>${escapeHtml(credit)}</span>` : "",
  ].filter(Boolean)
  const figcaption =
    captionParts.length > 0
      ? `<figcaption>${captionParts.join(" ")}</figcaption>`
      : ""
  return {
    html: `<figure><img src="media:${escapeHtml(path)}" alt="${escapeHtml(alt)}" loading="lazy">${figcaption}</figure>\n`,
    media: [{ path, alt }],
  }
}

const renderYoutube = (id: string | undefined, text: string) => {
  if (!id || !YOUTUBE_ID.test(id))
    throw new Error(`":::youtube" needs a valid YouTube video id`)
  const title = escapeHtml(text.trim() || "Video")
  return `<figure><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${title}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><figcaption>${title}</figcaption></figure>\n`
}

const renderSegment =
  (markdown: Marked) =>
  (part: Segment): { html: string; media: readonly MediaReference[] } => {
    if (part.kind === "markdown")
      return { html: markdown.parse(part.text, { async: false }), media: [] }
    if (part.name === "figure") return renderFigure(part.argument, part.text)
    if (part.name === "youtube")
      return { html: renderYoutube(part.argument, part.text), media: [] }
    const inner = markdown.parse(part.text, { async: false })
    const tag = BLOCKS[part.name]
    const tone = part.argument ? ` data-tone="${part.argument}"` : ""
    return {
      html: `<${tag} data-block="${part.name}"${tone}>\n${inner}</${tag}>\n`,
      media: [],
    }
  }

const coverCredit = ({ credit, creditUrl }: z.infer<typeof coverSchema>) => {
  if (!credit) return ""
  const text = escapeHtml(credit)
  const linked = creditUrl
    ? `<a href="${escapeHtml(creditUrl)}">${text}</a>`
    : text
  return `<p><em>Cover: ${linked}</em></p>
`
}

export const compileArticle = (
  source: string,
  slug: string
): CompiledArticle => {
  const { data, content } = matter(source)
  const parsed = frontmatterSchema.safeParse(data)
  if (!parsed.success)
    throw new Error(
      `${slug}: invalid frontmatter (${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")})`
    )
  const front = parsed.data
  const parts = segment(content).map(renderSegment(createMarkdown()))
  return {
    meta: {
      slug,
      title: front.title,
      description: front.description,
      topic: front.topic,
      author: front.author,
      tags: front.tags,
      cover: front.cover,
    },
    html: parts.map((part) => part.html).join("") + coverCredit(front.cover),
    media: [
      { path: front.cover.image, alt: front.cover.alt },
      ...parts.flatMap((part) => part.media),
    ],
  }
}
