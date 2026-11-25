"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

import { TextLink } from "@/components/ui/text-link"

export type Video = {
  readonly youtubeId: string
  readonly title: string
  readonly poster: string
}

const playerUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`

export function VideoEmbed({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="grid gap-4">
      <div className="group relative aspect-video overflow-hidden rounded-media bg-card">
        {playing ? (
          <iframe
            src={playerUrl(video.youtubeId)}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${video.title}`}
            className="absolute inset-0 size-full cursor-pointer"
          >
            <Image
              src={video.poster}
              alt=""
              fill
              sizes="(min-width: 1360px) 1300px, 100vw"
              quality={85}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <span className="absolute right-3 bottom-3 inline-flex size-12 items-center justify-center gap-2.5 rounded-full bg-foreground text-base font-medium text-background transition-transform duration-300 group-hover:scale-105 sm:right-6 sm:bottom-6 sm:size-auto sm:h-14 sm:pr-6 sm:pl-5">
              <Play className="size-5 fill-current" aria-hidden="true" />
              <span className="hidden sm:inline">Play the demo</span>
            </span>
          </button>
        )}
      </div>
      <TextLink
        href={watchUrl(video.youtubeId)}
        external
        className="justify-self-start"
      >
        Watch on YouTube
      </TextLink>
    </div>
  )
}
