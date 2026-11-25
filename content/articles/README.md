# Articles

Each file here is one article on cadogy.com/articles. The file name is the URL slug.

## Frontmatter

```yaml
---
title: "How to protect your website with Cloudflare: a practical setup guide"
description: "One or two sentences. Used as the meta description and the card summary."
topic: Security        # Engineering, Architecture, Security, Payments or AI
tags: [Cloudflare, WAF]
---
```

`topic` sets the WordPress category and the cover's color and icon.

## Blocks

Write normal Markdown, plus these blocks:

```md
:::summary
- Three to five key takeaways, shown near the top.
:::

:::callout warning
Use `note`, `tip` or `warning`.
:::

:::faq
### A question people actually search for?

A direct answer in the first sentence. These become FAQ structured data.
:::

:::sources
- [Primary source title, Publisher](https://example.com)
:::
```

## Writing rules

- Answer a real question better than what currently ranks for it.
- Every number and quote needs a source in the `:::sources` block.
- Short sentences, plain words, no hype. "You" for the reader, "we" for Cadogy.
- Only claim what we can back up about our own work.

## Commands

```bash
npm run blog -- preview                 # covers and HTML in .blog-preview/
npm run blog -- publish <slug>          # update, keeping the post's status
npm run blog -- publish <slug> --live   # update and publish
npm run blog -- publish --all --draft   # update everything as drafts
```

Publishing needs `WP_USERNAME` and `WP_APP_PASSWORD` in `.env.local`.
