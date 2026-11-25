import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6"

import { Button } from "@/components/ui/button"

import { CopyLink } from "./copy-link"

export function ShareArticle({ url, title }: { url: string; title: string }) {
  const links = [
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      Icon: FaLinkedinIn,
    },
    {
      label: "Share on X",
      href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      Icon: FaXTwitter,
    },
  ] as const
  return (
    <div role="group" aria-labelledby="share-title">
      <p id="share-title" className="text-sm text-muted-foreground">
        Share this article
      </p>
      <div className="mt-3 flex items-center gap-2">
        {links.map(({ label, href, Icon }) => (
          <Button key={label} asChild variant="outline" size="icon">
            <a
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="size-4" aria-hidden="true" />
            </a>
          </Button>
        ))}
        <CopyLink url={url} />
      </div>
    </div>
  )
}
