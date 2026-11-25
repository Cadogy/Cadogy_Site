import { decodeHtml } from "@/lib/wordpress-api"

const FAQ_BLOCK = /<section data-block="faq">([\s\S]*?)<\/section>/
const QUESTION = /<h3[^>]*>([\s\S]*?)<\/h3>/g

const plainText = (html: string) =>
  decodeHtml(
    html
      .replace(/<\/(p|li)>/g, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
  ).trim()

export const faqFromArticleHtml = (html: string) => {
  const block = FAQ_BLOCK.exec(html)?.[1]
  if (!block) return []
  const parts = block.split(QUESTION).slice(1)
  return parts.flatMap((part, index) =>
    index % 2 === 0
      ? [
          {
            question: plainText(part),
            answer: plainText(parts[index + 1] ?? ""),
          },
        ]
      : []
  )
}
