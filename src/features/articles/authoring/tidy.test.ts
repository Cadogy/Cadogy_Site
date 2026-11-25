// @vitest-environment node
import { describe, expect, it } from "vitest"

import { planTidy } from "./tidy"

const term = (id: number, name: string, count: number) => ({ id, name, count })

describe("planTidy", () => {
  it("removes topics and tags that no post uses", () => {
    const plan = planTidy({
      categories: [
        term(1, "General", 0),
        term(3, "Technology", 0),
        term(26, "Security", 2),
      ],
      tags: [
        term(8, "Content protection", 1),
        term(13, "Artificial intelligence", 0),
      ],
      media: [],
      posts: [],
      defaultCategoryId: 1,
    })

    expect(plan.categories).toEqual([{ id: 3, name: "Technology" }])
    expect(plan.tags).toEqual([{ id: 13, name: "Artificial intelligence" }])
  })

  it("never removes the default category, which WordPress requires", () => {
    const plan = planTidy({
      categories: [term(1, "General", 0)],
      tags: [],
      media: [],
      posts: [],
      defaultCategoryId: 1,
    })

    expect(plan.categories).toEqual([])
  })

  it("removes images that no post shows as its cover or in its content", () => {
    const plan = planTidy({
      categories: [],
      tags: [],
      media: [
        { id: 76, url: "https://wp.example.com/uploads/old-cover.webp" },
        { id: 90, url: "https://wp.example.com/uploads/current-cover.webp" },
        { id: 91, url: "https://wp.example.com/uploads/diagram.png" },
      ],
      posts: [
        {
          featuredMedia: 90,
          content: '<img src="https://wp.example.com/uploads/diagram.png">',
        },
      ],
      defaultCategoryId: 1,
    })

    expect(plan.media).toEqual([
      { id: 76, url: "https://wp.example.com/uploads/old-cover.webp" },
    ])
  })

  it("keeps the site icon and logo even though no post uses them", () => {
    const plan = planTidy({
      categories: [],
      tags: [],
      media: [
        { id: 13, url: "https://wp.example.com/uploads/cadogy-square.png" },
      ],
      posts: [],
      defaultCategoryId: 1,
      siteMedia: [13],
    })

    expect(plan.media).toEqual([])
  })
})
