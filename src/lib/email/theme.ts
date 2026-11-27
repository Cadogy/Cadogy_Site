/**
 * Email colors. Inline styles carry the light theme every client gets; the
 * dark rules apply where clients honor `prefers-color-scheme` (Apple Mail,
 * iOS Mail, Outlook for Mac) and override the inline values by class.
 */
export const color = {
  page: "#ffffff",
  text: "#151513",
  muted: "#52525b",
  subtle: "#71717a",
  border: "#e4e4e7",
  surface: "#f4f4f5",
  brand: "#1f5ad6",
  button: "#151513",
  buttonText: "#ffffff",
  warningText: "#92400e",
  warningSurface: "#fffbeb",
  warningBorder: "#fde68a",
} as const

export const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const darkModeCss = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .em-page { background-color: #0b0b0a !important; }
  .em-text { color: #f4f4f5 !important; }
  .em-muted { color: #a1a1aa !important; }
  .em-subtle { color: #8b8b94 !important; }
  .em-border { border-color: #27272a !important; }
  .em-surface { background-color: #18181b !important; border-color: #27272a !important; }
  .em-button { background-color: #f4f4f5 !important; color: #0b0b0a !important; }
  .em-link { color: #8fb1ff !important; }
  .em-warning { background-color: #2a1f0a !important; border-color: #6b4f12 !important; color: #fcd34d !important; }
}
`
