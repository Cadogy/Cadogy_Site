import { describe, expect, it } from "vitest"

import { siteConfig } from "@/config/site"

import * as content from "./content"

const PITCH =
  /AI[- ]accelerated|accelerated by AI|AI at every|AI-native|AI-powered delivery|\bwe use AI\b/i

describe("marketing copy", () => {
  it("never pitches our own use of AI anywhere in the site copy", () => {
    expect(JSON.stringify(content)).not.toMatch(PITCH)
    expect(JSON.stringify(siteConfig)).not.toMatch(PITCH)
  })
})
