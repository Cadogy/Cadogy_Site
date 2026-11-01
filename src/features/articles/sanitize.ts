import sanitizeHtml from "sanitize-html"

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
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "title"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: TRUSTED_EMBED_HOSTS,
    transformTags: {
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
