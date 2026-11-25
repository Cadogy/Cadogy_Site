const ALL = "wp"
const POSTS = "wp:posts"
const TERMS = "wp:terms"
const postTag = (slug: string) => `wp:post:${slug}`

export const contentTags = {
  post: (slug: string) => [ALL, postTag(slug)],
  posts: () => [ALL, POSTS],
  terms: () => [ALL, TERMS],
}

export const tagsToExpire = ({ slugs }: { slugs: readonly string[] }) =>
  slugs.length === 0 ? [ALL] : [POSTS, TERMS, ...slugs.map(postTag)]
