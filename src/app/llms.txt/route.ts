import { buildLlmsTxt } from "@/lib/seo/llms"
import { decodeHtml, extractExcerpt, getAllPosts } from "@/lib/wordpress-api"


const loadArticles = async () => {
  try {
    return (await getAllPosts()).map((post) => ({
      title: decodeHtml(post.title.rendered),
      slug: post.slug,
      summary: extractExcerpt(post.excerpt.rendered, 200),
    }))
  } catch (error) {
    console.error("llms.txt could not load articles", error)
    return []
  }
}

export async function GET() {
  return new Response(buildLlmsTxt({ articles: await loadArticles() }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
