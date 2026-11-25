"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CornerDownLeft, Search } from "lucide-react"

import { Input } from "@/components/ui/input"

function SearchInput({ value }: { value?: string }) {
  return (
    <Input
      id="article-search"
      name="search"
      type="search"
      placeholder="Search articles"
      defaultValue={value}
      className="bg-card pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"
    />
  )
}

function SearchInputFromUrl() {
  return <SearchInput value={useSearchParams().get("search") ?? undefined} />
}

export function ArticleSearch() {
  return (
    <form
      action="/articles"
      method="get"
      role="search"
      className="relative w-full lg:max-w-sm"
    >
      <label htmlFor="article-search" className="sr-only">
        Search articles
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Suspense fallback={<SearchInput />}>
        <SearchInputFromUrl />
      </Suspense>
      <button
        type="submit"
        aria-label="Search"
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-chip bg-foreground/6 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <CornerDownLeft className="size-3.5" aria-hidden="true" />
      </button>
    </form>
  )
}
