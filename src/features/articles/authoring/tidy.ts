type Term = {
  readonly id: number
  readonly name: string
  readonly count: number
}
type Media = { readonly id: number; readonly url: string }
type Post = { readonly featuredMedia: number; readonly content: string }

const unused = (terms: readonly Term[]) =>
  terms.filter((term) => term.count === 0).map(({ id, name }) => ({ id, name }))

export const planTidy = ({
  categories,
  tags,
  media,
  posts,
  defaultCategoryId,
  siteMedia = [],
}: {
  categories: readonly Term[]
  tags: readonly Term[]
  media: readonly Media[]
  posts: readonly Post[]
  defaultCategoryId: number
  siteMedia?: readonly number[]
}) => {
  const covers = new Set([
    ...posts.map((post) => post.featuredMedia),
    ...siteMedia,
  ])
  const content = posts.map((post) => post.content).join("\n")
  const fileName = (url: string) => url.split("/").pop() ?? url
  return {
    categories: unused(categories).filter(
      (category) => category.id !== defaultCategoryId
    ),
    tags: unused(tags),
    media: media.filter(
      (item) => !covers.has(item.id) && !content.includes(fileName(item.url))
    ),
  }
}
