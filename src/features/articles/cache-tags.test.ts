// @vitest-environment node
import { describe, expect, it } from "vitest"

import { contentTags, tagsToExpire } from "./cache-tags"

describe("content cache tags", () => {
  it("tags every WordPress read so one call can clear them all", () => {
    expect(contentTags.post("stripe-webhooks")).toEqual([
      "wp",
      "wp:post:stripe-webhooks",
    ])
    expect(contentTags.posts()).toEqual(["wp", "wp:posts"])
    expect(contentTags.terms()).toEqual(["wp", "wp:terms"])
  })

  it("expires the changed posts plus every list and topic they appear in", () => {
    expect(tagsToExpire({ slugs: ["a", "b"] })).toEqual([
      "wp:posts",
      "wp:terms",
      "wp:post:a",
      "wp:post:b",
    ])
  })

  it("expires everything when it doesn't know what changed", () => {
    expect(tagsToExpire({ slugs: [] })).toEqual(["wp"])
  })
})
