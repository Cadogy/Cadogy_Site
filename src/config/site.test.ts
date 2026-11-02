import { afterEach, describe, expect, it, vi } from "vitest"

const loadSiteWithAppUrl = async (appUrl: string | undefined) => {
  vi.resetModules()
  vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl)
  return import("./site")
}

describe("site URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("defaults to the www host when no app URL is configured", async () => {
    const { absoluteUrl } = await loadSiteWithAppUrl(undefined)

    expect(absoluteUrl("/work")).toBe("https://www.cadogy.com/work")
  })

  it("uses the configured app URL when one is set", async () => {
    const { absoluteUrl } = await loadSiteWithAppUrl("https://preview.example.com")

    expect(absoluteUrl("/work")).toBe("https://preview.example.com/work")
  })
})
