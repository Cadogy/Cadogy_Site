import {
  articleSchema,
  breadcrumbSchema,
  type ArticleFacts,
} from "@/lib/seo/structured-data"

import { JsonLd } from "./json-ld"

export function ArticleSchema(props: ArticleFacts) {
  return (
    <JsonLd
      data={[
        articleSchema(props),
        breadcrumbSchema([
          { name: "Articles", path: "/articles" },
          { name: props.title, path: `/articles/${props.slug}` },
        ]),
      ]}
    />
  )
}
