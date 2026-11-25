import matter from "gray-matter"
import { Marked } from "marked"
import { z } from "zod"

import { COVER_VARIANTS, type CoverVariant } from "../domain/cover"

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  topic: z.string().min(1).default("General"),
  tags: z.array(z.string().min(1)).default([]),
  cover: z.enum(COVER_VARIANTS).optional(),
})

type ArticleMeta = {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly topic: string
  readonly tags: readonly string[]
  readonly cover?: CoverVariant
}

export type CompiledArticle = {
  readonly meta: ArticleMeta
  readonly html: string
}

const BLOCKS = {
  summary: "aside",
  callout: "aside",
  sources: "aside",
  faq: "section",
} as const

type BlockName = keyof typeof BLOCKS

const isBlockName = (name: string): name is BlockName => name in BLOCKS

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
    },
  })
}

type Segment =
  | { readonly kind: "markdown"; readonly text: string }
  | {
      readonly kind: "block"
      readonly name: BlockName
      readonly tone?: string
      readonly text: string
    }

const OPEN = /^:::([a-z]+)(?:\s+([a-z]+))?\s*$/
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
      tone: open[2],
      text: lines.slice(index + 1, end).join("\n"),
    })
    index = end
  }
  flush()
  return result
}

const renderSegment = (markdown: Marked) => (part: Segment) => {
  const inner = markdown.parse(part.text, { async: false })
  if (part.kind === "markdown") return inner
  const tag = BLOCKS[part.name]
  const tone = part.tone ? ` data-tone="${part.tone}"` : ""
  return `<${tag} data-block="${part.name}"${tone}>\n${inner}</${tag}>\n`
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
  const markdown = createMarkdown()
  return {
    meta: {
      slug,
      title: front.title,
      description: front.description,
      topic: front.topic,
      tags: front.tags,
      cover: front.cover,
    },
    html: segment(content).map(renderSegment(markdown)).join(""),
  }
}
