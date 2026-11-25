import sanitizeHtml from "sanitize-html"

const BLOCK_VALUES: Record<string, Record<string, readonly string[]>> = {
  aside: {
    "data-block": ["summary", "callout", "sources"],
    "data-tone": ["note", "tip", "warning"],
  },
  section: { "data-block": ["faq"] },
}

const keepKnownBlockMarkers =
  (tagName: string) => (_tag: string, attribs: sanitizeHtml.Attributes) => ({
    tagName,
    attribs: Object.fromEntries(
      Object.entries(attribs).filter(([name, value]) => {
        const allowed = BLOCK_VALUES[tagName]?.[name]
        return allowed ? allowed.includes(value) : true
      })
    ),
  })

const TRUSTED_EMBED_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
]

export const sanitizeArticleHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "iframe",
      "picture",
      "source",
      "video",
    ],
    allowedAttributes: {
      "*": ["id", "class"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
      source: ["src", "srcset", "type", "media"],
      video: ["src", "controls", "poster", "width", "height"],
      iframe: [
        "src",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "title",
        "loading",
      ],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      span: ["style"],
      aside: ["data-block", "data-tone"],
      section: ["data-block"],
    },
    allowedStyles: { span: { color: [/^#[0-9a-fA-F]{3,8}$/] } },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: TRUSTED_EMBED_HOSTS,
    transformTags: {
      aside: keepKnownBlockMarkers("aside"),
      section: keepKnownBlockMarkers("section"),
      a: (tagName, attribs) => {
        const external =
          /^https?:\/\//.test(attribs.href ?? "") &&
          !attribs.href?.includes("cadogy.com")
        return {
          tagName,
          attribs: external
            ? { ...attribs, rel: "noopener noreferrer", target: "_blank" }
            : attribs,
        }
      },
    },
  })
