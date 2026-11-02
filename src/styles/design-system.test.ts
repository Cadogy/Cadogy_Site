import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"

const SRC = join(process.cwd(), "src")

const componentFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return componentFiles(path)
    return entry.name.endsWith(".tsx") && !entry.name.includes(".test.")
      ? [path]
      : []
  })

const FILES = componentFiles(SRC).map((path) => ({
  file: relative(SRC, path).replaceAll("\\", "/"),
  lines: readFileSync(path, "utf8").split("\n"),
}))

type Rule = {
  readonly name: string
  readonly why: string
  readonly pattern: RegExp
  readonly allowedIn?: readonly string[]
}

const RULES: readonly Rule[] = [
  {
    name: "rules sit on top",
    why: "Separate content with a top rule (border-t, rule-list) so a block never ends in a line that doubles up with the next section's rule.",
    pattern:
      /(?<![\w:-])(?:[a-z]+:)*border-(?:b|y)(?![\w-])|(?<![\w:-])divide-y border-y/,
    allowedIn: [
      "components/portal/portal-shell.tsx",
      "components/portal/impersonation-banner.tsx",
      "features/account/components/account-tabs.tsx",
    ],
  },
  {
    name: "no boxed empty states",
    why: "Use <EmptyState>: muted text under a top rule.",
    pattern: /border-dashed/,
  },
  {
    name: "type weights 400–500",
    why: "Use font-normal or font-medium. The logo wordmark is the only exception.",
    pattern: /font-(?:semibold|bold|extrabold|black)\b/,
    allowedIn: ["components/site/logo.tsx"],
  },
  {
    name: "type from the scale",
    why: "Use text-display/h1/h2/h3/title/statement/lead/meta, or text-xs/sm/base/lg.",
    pattern: /\btext-(?:xl|[2-9]xl|\[\d)/,
  },
  {
    name: "no uppercase labels",
    why: "Labels are sentence case.",
    pattern: /\b(?:uppercase|tracking-wide|tracking-wider|tracking-widest)\b/,
  },
  {
    name: "radius from tokens",
    why: "Use rounded-full (controls), rounded-field (inputs), rounded-panel (portal panels) or rounded-media (images).",
    pattern: /\brounded-(?:sm|md|lg|xl|2xl|3xl|\[)/,
  },
  {
    name: "no shadows",
    why: "Depth comes from surface steps on the dark canvas, not shadows.",
    pattern: /(?<![\w-])shadow-(?!none)/,
  },
  {
    name: "fade, don't slide",
    why: "Overlays fade in. Sliding full-screen panels are disorienting.",
    pattern: /slide-(?:in|out)-/,
  },
  {
    name: "colors from tokens",
    why: "Use theme tokens (bg-background, text-muted-foreground, border, brand...). Raw hex lives only in globals.css and config/theme-colors.ts.",
    pattern: /#[0-9a-fA-F]{3,8}\b(?!\])/,
  },
  {
    name: "one container",
    why: "Use .container-page on the site and the portal shell's content width in the portal.",
    pattern: /\bmax-w-(?:6xl|7xl|screen-)/,
  },
]

const violationsOf = (rule: Rule) =>
  FILES.filter(({ file }) => !rule.allowedIn?.includes(file)).flatMap(
    ({ file, lines }) =>
      lines.flatMap((line, index) =>
        rule.pattern.test(line) ? [`${file}:${index + 1}  ${line.trim()}`] : []
      )
  )

describe("design system", () => {
  it.each(RULES)("$name", (rule) => {
    expect(violationsOf(rule), rule.why).toEqual([])
  })

  it("only allows exceptions that are still needed", () => {
    const stale = RULES.flatMap((rule) =>
      (rule.allowedIn ?? []).filter((file) => {
        const source = FILES.find((entry) => entry.file === file)
        return !source?.lines.some((line) => rule.pattern.test(line))
      })
    )
    expect(stale).toEqual([])
  })
})
