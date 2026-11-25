import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { VideoEmbed } from "./video-embed"

const video = {
  youtubeId: "_KMBRo7zrMw",
  title: "Sidecar for OpenCode: a quick tour",
  poster: "/images/studio/sidecar-video.webp",
}

describe("VideoEmbed", () => {
  it("shows a poster and plays the video on YouTube's privacy-enhanced player only when asked", async () => {
    const user = userEvent.setup()
    render(<VideoEmbed video={video} />)

    expect(document.querySelector("iframe")).toBeNull()
    await user.click(
      screen.getByRole("button", {
        name: "Play video: Sidecar for OpenCode: a quick tour",
      })
    )

    const player = screen.getByTitle("Sidecar for OpenCode: a quick tour")
    expect(player.tagName).toBe("IFRAME")
    expect(player.getAttribute("src")).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/_KMBRo7zrMw\?.*autoplay=1/
    )
  })

  it("always links to the video on YouTube as a fallback", () => {
    render(<VideoEmbed video={video} />)

    expect(
      screen.getByRole("link", { name: /Watch on YouTube/ })
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=_KMBRo7zrMw")
  })
})
