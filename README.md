# Svaela

Svaela is a typed TypeScript library for color conversion, Color Thief image
extraction, Material 3 color schemes, and small text templates.

## Install

```sh
bun add svaela
# or
npm install svaela
```

`sharp` is a peer dependency for Node image decoding. In browsers, pass a
Color Thief-compatible image or canvas source.

## Color conversion

```ts
import {
  convertColorFromArgb,
  convertColorToArgb,
  formatColor,
  hexToArgb,
} from "svaela";

const seed = hexToArgb("#6750a4");
const oklch = convertColorFromArgb(seed, "oklch");
const css = formatColor(oklch, "oklch");
const argb = convertColorToArgb("#6750a4", "hex");
```

Supported formats are `hex`, `argb`, `rgb`, `rgba`, `hsl`, `hsla`, and `oklch`.
The format argument narrows the result without a large generic type hierarchy.
Packed values use unsigned `0xAARRGGBB`; signed 32-bit values are accepted and
normalized. Invalid ranges throw `RangeError` or `TypeError`.

## Extract image colors

```ts
import {
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
} from "svaela";

const dominant = await getDominantColorFromImage(image, "hex");
const palette = await getPaletteColorFromImage(image, "rgb", 5);
const swatches = await getSwatchColorFromImage(image, "rgba");
```

Palette sizes are integers from 2 to 20. Dominant and palette extraction return
`undefined` when no color is available. Swatch extraction always returns the
six keys in `SWATCH_NAMES`, with `undefined` for unavailable swatches.

## Material 3 schemes

```ts
import { hexToArgb, schemeFromSourceColor } from "svaela";

const scheme = schemeFromSourceColor(hexToArgb("#6750a4"), {
  format: "hex",
  scheme: "tonalSpot",
  contrastLevel: 0,
});

scheme.sourceColor;             // "#6750a4"
scheme.colors.primary.light;    // role value for light mode
scheme.colors.primary.dark;     // role value for dark mode
```

The result is intentionally role-oriented: every role contains its `light` and
`dark` value. This makes it straightforward to serialize or template themes.
Use `schemeFromDominantColor`, `schemeFromPaletteColors`,
`schemeFromSwatchColors`, or `schemeFromImageToColor` for metadata-bearing
arrays. Their defaults are `hex`, `tonalSpot`, and contrast `0`.

`MATERIAL_ROLES`, `SWATCH_NAMES`, `SCHEMES`, and all related types are exported.

## Templates

Templates support paths, parent paths, sections, and explicit loops:

```ts
import { renderTemplate, schemeFromSourceColor } from "svaela";

const theme = schemeFromSourceColor(0xff6750a4);
const css = renderTemplate(
  ":root {\n{{#each colors as role}}  --{{role}}: {{colors.(role).(mode)}};\n{{/each}}}",
  { colors: theme.colors, mode: "dark" },
);
```

`{{#each list as item}}...{{/each}}` binds each item to `item`, while
`{{#list}}...{{/list}}` is a shorthand for arrays. Parent contexts can be
accessed with `../`. Rendering is plain text and does not HTML-escape values.

## Development

```sh
bun install
bun run typecheck
bun run build
bun test
```

`bun run build` invokes TypeScript with the project `tsconfig.json` and writes
compiled JavaScript, source maps, and declaration files to `dist/`. The
published
package entry points resolve to `dist/index.js` and `dist/index.d.ts`.

Run the examples individually:

```sh
bun run example:convert
bun run example:scheme
bun run example:template
bun run extract
```

The package entry point is [`index.ts`](./index.ts). Complete runnable
examples are in [`examples/`](./examples/):

- [`convertColor.ts`](./examples/convertColor.ts) converts a color and formats
  it as CSS in every supported format, demonstrates dedicated converters,
  object-to-ARGB conversion, and the dispatch table.
- [`materialScheme.ts`](./examples/materialScheme.ts) creates a Material 3
  role-oriented scheme and demonstrates every scheme style, output format,
  contrast options, dominant/palette/swatch sources, and image options.
- [`renderTheme.ts`](./examples/renderTheme.ts) renders scheme roles into CSS
  custom properties and demonstrates dynamic paths, object sections, and
  explicit item aliases.
- [`extractImage.ts`](./examples/extractImage.ts) extracts dominant, palette,
  swatch, multiple output formats, and image-based schemes for every
  extraction mode.
