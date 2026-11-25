import Image from "next/image"

import { cn } from "@/lib/utils"

const FRAME = "relative overflow-hidden rounded-media bg-card"

export function ProductCapture({
  image,
  mobileImage,
  alt,
  sizes,
  priority = false,
}: {
  image: string
  mobileImage: string
  alt: string
  sizes: string
  priority?: boolean
}) {
  return (
    <>
      <div className={cn(FRAME, "aspect-3/4 sm:hidden")}>
        <Image
          src={mobileImage}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          quality={85}
          className="object-cover object-top-left"
        />
      </div>
      <div className={cn(FRAME, "hidden aspect-video sm:block")}>
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          quality={85}
          className="object-cover object-top"
        />
      </div>
    </>
  )
}
