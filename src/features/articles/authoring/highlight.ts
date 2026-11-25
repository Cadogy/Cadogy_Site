import bash from "@shikijs/langs/bash"
import css from "@shikijs/langs/css"
import diff from "@shikijs/langs/diff"
import dotenv from "@shikijs/langs/dotenv"
import html from "@shikijs/langs/html"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import jsx from "@shikijs/langs/jsx"
import python from "@shikijs/langs/python"
import sql from "@shikijs/langs/sql"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import yaml from "@shikijs/langs/yaml"
import theme from "@shikijs/themes/github-dark-default"
import { createHighlighterCoreSync } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

const THEME = "github-dark-default"

const highlighter = createHighlighterCoreSync({
  themes: [theme],
  langs: [
    bash,
    css,
    diff,
    dotenv,
    html,
    javascript,
    json,
    jsx,
    python,
    sql,
    tsx,
    typescript,
    yaml,
  ],
  engine: createJavaScriptRegexEngine(),
})

const ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  env: "dotenv",
}

export const highlightCode = (code: string, language = "") => {
  const name = ALIASES[language] ?? language
  const lang = highlighter.getLoadedLanguages().includes(name) ? name : "text"
  return highlighter.codeToHtml(code, { lang, theme: THEME })
}
