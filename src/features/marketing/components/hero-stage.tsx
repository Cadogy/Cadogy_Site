import Image from "next/image"

export function HeroStage({ alt }: { alt: string }) {
  return (
    <div
      id="hero-stage"
      className="relative isolate aspect-[1898/947] w-[120%] max-w-none transform-gpu overflow-hidden rounded-t-media border-x border-t bg-card lg:aspect-auto lg:min-h-[24rem] lg:w-[calc(100%+50vw)] lg:flex-none"
    >
      <Image
        src="/images/studio/playerbay-storefront.webp"
        alt={alt}
        width={1898}
        height={947}
        loading="eager"
        fetchPriority="high"
        unoptimized
        className="absolute top-0 left-0 h-auto w-full max-w-none lg:w-[max(62vw,calc((100svh-13rem)*1.6))] lg:[mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
      />
    </div>
  )
}
