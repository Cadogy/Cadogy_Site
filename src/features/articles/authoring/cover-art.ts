type Rgb = readonly [number, number, number]

type CoverArtInput = {
  readonly width: number
  readonly height: number
  readonly cell: number
  readonly shade: (column: number, row: number) => Rgb
  readonly marks: readonly string[]
}

const BRAND = "rgb(112,156,255)"
const PHOTO_SOLID = 0.38
const PHOTO_GONE = 0.88
const BRAND_FROM = 0.64
const TILE = 0.31
const TILE_GAP = 0.03

const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

const round = (value: number) => Number(value.toFixed(2))

const fadeSvg = ({ width, height }: CoverArtInput) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="${PHOTO_SOLID}" stop-color="#fff" stop-opacity="1"/><stop offset="${PHOTO_GONE}" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#fade)"/></svg>`

const block = ({
  kind,
  x,
  y,
  size,
  fill,
  opacity,
}: {
  kind: "photo" | "brand"
  x: number
  y: number
  size: number
  fill: string
  opacity: number
}) =>
  `<rect data-cell="${kind}" x="${round(x)}" y="${round(y)}" width="${round(size)}" height="${round(size)}" rx="${round(size * 0.08)}" fill="${fill}" fill-opacity="${opacity.toFixed(3)}"/>`

const blocks = ({ width, height, cell, shade }: CoverArtInput) => {
  const columns = Math.ceil(width / cell)
  const rows = Math.ceil(height / cell)
  const gap = cell * 0.1
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = column * cell
    const y = row * cell
    const depth = (y + cell / 2) / height
    const seed = noise(column, row)
    const patch = noise(Math.floor(column / 3), Math.floor(row / 3))
    const clump = noise(Math.floor(column / 2) + 17, Math.floor(row / 2) + 31)
    const spot = { x: x + gap / 2, y: y + gap / 2, size: cell - gap }
    const breaking = (depth - PHOTO_SOLID) / (PHOTO_GONE - PHOTO_SOLID)
    if (
      breaking > 0.08 &&
      breaking < 1 &&
      (seed + clump) / 2 < 0.2 + breaking * 0.45
    ) {
      const [red, green, blue] = shade(column, row)
      const light = (red + green + blue) / 765
      return block({
        kind: "photo",
        ...spot,
        fill: `rgb(${red},${green},${blue})`,
        opacity: Math.min(0.8, 0.12 + light * 0.75 * (1 - breaking * 0.6)),
      })
    }
    const trail = (depth - BRAND_FROM) / (1 - BRAND_FROM)
    if (trail > 0 && seed > 0.45 && patch < 0.2 + trail * 0.45) {
      return block({
        kind: "brand",
        ...spot,
        fill: BRAND,
        opacity: seed > 0.975 ? 0.4 : 0.05 + trail * 0.1,
      })
    }
    return ""
  }).join("")
}

const tiles = ({ width, height, marks }: CoverArtInput) => {
  const size = height * (marks.length > 1 ? TILE * 0.85 : TILE)
  const step = size + height * TILE_GAP
  const first = width / 2 - ((marks.length - 1) * step) / 2
  const top = height / 2 - size / 2
  const logo = size * 0.5
  return marks
    .map((source, index) => {
      const center = first + index * step
      const left = center - size / 2
      const placed = source.replace(
        /^<svg\b/,
        `<svg x="${round(center - logo / 2)}" y="${round(height / 2 - logo / 2)}" width="${round(logo)}" height="${round(logo)}"`
      )
      return `<rect data-tile="mark" x="${round(left)}" y="${round(top)}" width="${round(size)}" height="${round(size)}" rx="${round(size * 0.22)}" fill="rgb(12,14,18)" fill-opacity="0.84" stroke="#fff" stroke-opacity="0.14" stroke-width="${round(size * 0.006)}"/>${placed}`
    })
    .join("")
}

export const coverArt = (input: CoverArtInput) => ({
  fade: fadeSvg(input),
  overlay: `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}">${blocks(input)}${tiles(input)}</svg>`,
})
