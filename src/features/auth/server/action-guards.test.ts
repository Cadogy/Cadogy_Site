// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const SRC = path.resolve(import.meta.dirname, "../../..")

const PUBLIC_ACTIONS = new Set(["startCheckoutAction", "submitInquiry"])

const GUARD = /\b(requireSession|requirePermission|requireStaff)\(/

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(name) && !name.includes(".test.") ? [full] : []
  })

const serverActions = () =>
  sourceFiles(SRC)
    .map((file) => ({ file, source: readFileSync(file, "utf8") }))
    .filter(({ source }) => source.trimStart().startsWith('"use server"'))
    .flatMap(({ file, source }) =>
      source
        .split(/\n(?=export )/)
        .map((chunk) => ({
          file: path.relative(SRC, file),
          name: chunk.match(/^export (?:async function|const) (\w+)/)?.[1],
          body: chunk,
        }))
        .filter(
          (action): action is { file: string; name: string; body: string } =>
            Boolean(action.name)
        )
    )

describe("server action guards", () => {
  it("finds the app's server actions", () => {
    expect(serverActions().length).toBeGreaterThan(30)
  })

  it("checks auth in every non-public server action", () => {
    const unguarded = serverActions()
      .filter((action) => !PUBLIC_ACTIONS.has(action.name))
      .filter((action) => !GUARD.test(action.body))
      .map((action) => `${action.file}: ${action.name}`)

    expect(unguarded).toEqual([])
  })
})
