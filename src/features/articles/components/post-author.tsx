import Image from "next/image"

import type { PostAuthor as Author } from "../post-facts"

export function PostAuthor({ author }: { author: Author }) {
  return (
    <div className="flex items-center gap-3">
      {author.image ? (
        <Image
          src={author.image}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full object-cover"
        />
      ) : null}
      <div className="text-sm">
        <p className="font-medium text-foreground">{author.name}</p>
        {author.role ? (
          <p className="text-muted-foreground">{author.role}</p>
        ) : null}
      </div>
    </div>
  )
}
