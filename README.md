# Svaela

A typed TypeScript library for color conversion, image palette extraction,
Material 3 color schemes, and plain-text theme templates.

- Convert between hex, packed ARGB, RGB(A), HSL(A), and OKLCH.
- Extract dominant colors, palettes, and semantic swatches with Color Thief.
- Generate light/dark Material roles from a seed or an image.
- Render those roles into CSS or other text formats.

## Contents

- [Installation and runtimes](#installation-and-runtimes)
- [Quick start](#quick-start)
- [Color formats and units](#color-formats-and-units)
- [Color conversion](#color-conversion)
- [Image extraction](#image-extraction)
- [Material 3 schemes](#material-3-schemes)
- [Templates](#templates)
- [Naming conventions and migration](#naming-conventions-and-migration)
- [Source guide](#source-guide)
- [Development and examples](#development-and-examples)

## Installation and runtimes

```sh
bun add svaela
# or
npm install svaela
```

For Node.js file/Buffer image decoding, install the `sharp` peer dependency too:

```sh
bun add sharp
# or
npm install sharp
```

Conversion, seed-based schemes, and templates do not decode images. Image source
support follows Color Thief and depends on the runtime:

| Runtime | Image sources |
| --- | --- |
| Browser | Ready image/video elements, canvases, `ImageData`, `ImageBitmap`, and `OffscreenCanvas` |
| Node.js | File path strings and Buffers, using the default `sharp` loader |

Browser images must be canvas-readable; cross-origin images require appropriate
CORS permissions. A string passed to the default Node loader is a file path, not
a URL-fetch request. Loading/decoding failures reject the extraction promise.

Import the public API from `"svaela"`, rather than internal `src/` or `dist/` paths.

## Quick start

```ts
import {
  convertColorFromArgb,
  formatColor,
  hexToArgb,
  createMaterialScheme,
} from "svaela";

const seed = hexToArgb("#6750a4");
const rgba = convertColorFromArgb(seed, "rgba");
const css = formatColor(rgba, "rgba"); // "rgba(103 80 164 / 1)"

const theme = createMaterialScheme(seed);
console.log(theme.colors.primary.light); // light-mode hex string
console.log(theme.colors.primary.dark);  // dark-mode hex string
```

## Color formats and units

| Format key | Value | Units and alpha |
| --- | --- | --- |
| `hex` | `string` | Input: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; generated output: lowercase `#rrggbb` or `#rrggbbaa` |
| `argb` | `number` | Packed `0xAARRGGBB`; signed 32-bit inputs accepted, unsigned output |
| `rgb` | `{ r, g, b }` | sRGB channels 0–255; no alpha |
| `rgba` | `{ r, g, b, a }` | RGB plus alpha 0–1 |
| `hsl` | `{ h, s, l }` | Hue in degrees, saturation/lightness 0–100 percent; no alpha |
| `hsla` | `{ h, s, l, a }` | HSL plus alpha 0–1 |
| `oklch` | `{ l, c, h, a }` | Lightness 0–1, nonnegative raw chroma, degree hue, required alpha 0–1 |

Object channels must be finite. RGB channels can be fractional. Conversion wraps
finite hue into `[0, 360)`; achromatic conversions use hue zero. OKLCH chroma is
not a percentage and has no fixed validation maximum.

**Hex alpha is last; packed ARGB alpha is first.** For example, `#ff000080`
corresponds to `0x80ff0000`. A plain `0xff0000` integer has zero alpha in ARGB;
use `0xffff0000` for opaque red, or parse `"#ff0000"` with `hexToArgb`.

RGB/HSL results deliberately omit alpha. Choose RGBA/HSLA to retain it. Missing
alpha in an RGB/HSL object defaults to opaque when packing; OKLCH requires `a`.

## Color conversion

### General helpers

```ts
import { convertColorFromArgb, convertColorToArgb } from "svaela";

const packed = convertColorToArgb({ r: 255, g: 0, b: 0, a: 0.5 }, "rgba");
// 2164195328, i.e. 0x80ff0000 (alpha rounded to a byte)

const oklch = convertColorFromArgb(packed, "oklch");
const restored = convertColorToArgb(oklch, "oklch");
```

| Function | Purpose |
| --- | --- |
| `convertColorFromArgb(argb, format)` | Convert packed ARGB to the selected representation; format determines the return type |
| `convertColorToArgb(color, format)` | Parse/convert a value of the specified format to an unsigned ARGB integer |
| `formatColor(color, format)` | Serialize a value in its existing format; does not convert color spaces |

Format arguments are required and case-sensitive. There is no format detection.
Literal format keys infer precise types, such as `RGBA` for `"rgba"`.

### Dedicated converters

- `hexToArgb(hex)` parses exactly the four hex forms in the table, case-insensitively,
  with no surrounding whitespace.
- `argbToHex`, `argbToRgb`, `argbToRgba`, `argbToHsl`, `argbToHsla`, and
  `argbToOklch` convert packed integers to channel objects or hex.
- `rgbToArgb`, `hslToArgb`, and `oklchToArgb` pack channel objects into ARGB.
  RGB/HSL helpers also accept their alpha-bearing counterparts.
- `hslToRgb` and `oklchToRgb` produce fractional RGB channels without alpha.
- `ARGB_TO_COLOR_CONVERTERS` exposes the format-keyed ARGB-to-value dispatch table.

Packing rounds RGB and alpha to eight-bit channels. Passing through ARGB therefore
quantizes intermediate values. Inverse OKLCH conversion clips out-of-sRGB-gamut
channels; it does not perform perceptual gamut mapping or output Display P3.

Invalid numeric channels/packed integers throw `RangeError`; malformed hex throws
`TypeError`. Packed values must be integers in `-2^31..2^32-1`.

### Formatting and CSS

```ts
import { convertColorFromArgb, formatColor } from "svaela";

formatColor({ h: 270.1234, s: 50, l: 40 }, "hsl"); // "hsl(270.12 50% 40%)"
formatColor(0xffff0000, "argb"); // "4294901760" — decimal text, NOT CSS

// For a CSS value from ARGB, convert to RGBA first:
const css = formatColor(convertColorFromArgb(0xffff0000, "rgba"), "rgba");
```

Formatting validates hex and returns it unchanged. RGB(A) preserves numeric
precision. HSL(A) and OKLCH non-alpha channels are rounded to two decimal places,
with trailing zeros omitted; alpha is unchanged. Formatting does **not** wrap
hue or gamut-map OKLCH. The `argb` formatter simply returns `String(value)` and
does not validate/normalize its numeric input.

## Image extraction

```ts
import {
  extractDominantColor,
  extractPaletteColors,
  extractSwatchColors,
} from "svaela";

// Node.js example; browsers can pass a ready image/canvas instead.
const source = "./photo.png";
const dominant = await extractDominantColor(source, "hex");
const palette = await extractPaletteColors(source, "rgb", 5);
const swatches = await extractSwatchColors(source, "rgba");
```

| Function | Result when no color is available |
| --- | --- |
| `extractDominantColor(source, format)` | `undefined` |
| `extractPaletteColors(imageSource, format, paletteSize = 3)` | `undefined` |
| `extractSwatchColors(source, format)` | All six swatch keys with unavailable values set to `undefined` |

`paletteSize` must be an integer from 2 to 20; it is validated before image loading.
The resulting palette can contain fewer colors than requested. Swatch keys follow
`SWATCH_ROLES`: `Vibrant`, `DarkVibrant`, `LightVibrant`, `Muted`, `DarkMuted`,
`LightMuted`.

Extracted colors are **opaque**: per-pixel alpha is not preserved in palette
colors. The wrappers use Color Thief defaults except for palette size; sampling,
filtering, gamut, and loader options are not exposed per call. Default filtering
may be relaxed when no samples remain, so a transparent image is not guaranteed
to yield an empty result. Load, decode, canvas-security, and extraction errors
propagate rather than becoming `undefined`.

`convertExtractedColor(color, format)` converts an existing Color Thief `Color`;
`getSwatchColor(swatches, format, role)` reads one existing Color Thief swatch.
Neither helper loads an image.

## Material 3 schemes

### Generate from a seed

```ts
import { hexToArgb, createMaterialScheme } from "svaela";

const theme = createMaterialScheme(hexToArgb("#6750a4"), {
  format: "oklch",
  scheme: "tonalSpot",
  contrastLevel: 0,
});

// MaterialScheme<"oklch">
theme.sourceColor;          // OKLCH object
theme.colors.primary.light; // OKLCH object for light mode
theme.colors.primary.dark;  // OKLCH object for dark mode
```

Results are **role-first**, not mode-first:

```text
{ sourceColor, colors: { primary: { light, dark }, on_primary: { light, dark }, ... } }
```

Every `MATERIAL_ROLES` key is present, in that order. Source alpha is retained
when the selected format supports it; generated role colors are always opaque.

| Option | Default | Constraints |
| --- | --- | --- |
| `format` | `"hex"` | Any supported color format |
| `scheme` | `"tonalSpot"` | A `MaterialSchemeVariant` key from `MATERIAL_SCHEMES` |
| `contrastLevel` | `0` | Finite number from -1 (reduced) to 1 (increased) |
| `extractionMode` (images) | `"dominant"` | `"dominant"`, `"palette"`, or `"swatch"` |
| `paletteSize` (images) | `3` | Integer 2–20; used/validated only in palette mode |

Available variants: `content`, `vibrant`, `rainbow`, `neutral`, `fidelity`,
`tonalSpot`, `fruitSalad`, `expressive`, and `monochrome`.

`MaterialSchemeOptions` and `MaterialSchemeImageOptions` are non-generic. Overloads infer hex when
format is omitted and the matching channel type when a literal format is supplied.
Runtime-selected formats return the color-value union. `MaterialSchemeFormatOptions<Format>`
is available when an options variable must require a particular format.

### Generate result arrays

```ts
import { createMaterialSchemesFromImage } from "svaela";

const results = await createMaterialSchemesFromImage("./photo.png", {
  extractionMode: "palette",
  paletteSize: 5,
  format: "hex",
  scheme: "vibrant",
});

for (const result of results) {
  console.log(result.id, result.name, result.colors.primary.dark);
}
```

Every array entry has `{ id, name, sourceColor, colors }`.

| Function | Ordering and metadata |
| --- | --- |
| `createMaterialSchemesFromDominantColor(argb, options?)` | One result: `id: "dominant"`, `name: "Dominant"` |
| `createMaterialSchemesFromPalette(argbColors, options?)` | Input order, including duplicates; IDs `"1"`, `"2"`, … and names `"Palette-1"`, … |
| `createMaterialSchemesFromSwatches(argbSwatches, options?)` | `SWATCH_ROLES` order; swatch key is both ID and name; unavailable swatches skipped |
| `createMaterialSchemesFromImage(source, options?)` | Extracts the selected strategy, then applies the corresponding helper above |

The first three helpers accept a `MaterialSchemeVariant` string instead of an options
object for hex output at standard contrast. They consume packed ARGB seeds, not
formatted colors. `createMaterialSchemesFromPalette` itself has no size limit.

Empty palettes, unavailable swatches, and image extraction with no colors return
`[]`. ARGB `0` is valid and is not skipped. Contrast is validated only when a
seed is generated; an empty result does not validate contrast. Image-loading
errors still reject the promise, and missing upstream Material roles throw.

## Templates

`renderTemplate(template, data)` synchronously renders plain text. It is intended
for small theme exports, not as a complete Handlebars replacement.

```ts
import { renderTemplate, createMaterialScheme } from "svaela";

const theme = createMaterialScheme(0xff6750a4);
const css = renderTemplate(
  ":root {\n{{#each colors as role}}  --{{role}}: {{colors.(role).(mode)}};\n{{/each}}}",
  { colors: theme.colors, mode: "dark" },
);
```

| Syntax | Meaning |
| --- | --- |
| `{{user.name}}` | Dotted property lookup |
| `{{../name}}` | Lookup in the parent loop context; repeat `../` to ascend further |
| `{{colors.(role).(mode)}}` | Dynamic keys from variables; missing/null variables fall back to the segment's literal name |
| `{{#each items as item}}...{{/each}}` | Array loop; `item` is the element, `this` is the element, `index` is zero-based |
| `{{#each colors as role}}...{{/each}}` | Object loop; `role` is the key, `this` is the value, `index` is zero-based |
| `{{#items}}...{{/items}}` | Array shorthand loop; each element becomes the current context |
| `{{#enabled}}...{{/enabled}}` | For non-arrays, render once in the unchanged context if truthy |

Without an explicit `as` alias, `#each` supplies `this` and `index`. Root variables
remain available inside loops; aliases/root variables take precedence over
current-item fields. Missing/null placeholder values become empty strings; other
values use `String(value)`.

**Limitations:** block matching is regex-based. Avoid nested `#each` blocks or
recursively nested sections with the same name. Rendering performs no HTML
escaping or sanitization; never inject untrusted rendered text as HTML. There
are no template helpers, includes, or file I/O, and input data is not mutated.

## Naming conventions and migration

Names describe both the operation and its result:

- `extract…` reads an image asynchronously; `getSwatchColor` reads an existing map.
- `convert…` changes representations; dedicated converters use `inputToOutput`.
- `createMaterialScheme` returns one scheme. `createMaterialSchemesFrom…` returns
  an array of `MaterialSchemeResult` entries with metadata.
- `MaterialScheme…` types describe schemes and their options. `…Role` describes a
  semantic category; `…Mode` selects an appearance or extraction strategy.
- Constants use `UPPER_SNAKE_CASE`, functions/variables use `camelCase`, and types
  use `PascalCase`. Standard color-space types (`RGB`, `HSL`, `OKLCH`) and channel
  keys (`r/g/b`, `h/s/l`, `l/c/h`, `a`) keep their conventional spelling.
- `sourceArgb`, `paletteArgb`, and `swatchArgb` identify packed seed inputs;
  `imageSource`, `paletteSize`, and `contrastLevel` describe their actual purpose.
  Generic format parameters are named `Format` rather than alternating letters.

Previous exports remain available as deprecated aliases; function aliases retain
identity and overload inference. New code and examples use the canonical names:

| Previous name | Canonical name |
| --- | --- |
| `getDominantColorFromImage` | `extractDominantColor` |
| `getPaletteColorFromImage` | `extractPaletteColors` |
| `getSwatchColorFromImage` | `extractSwatchColors` |
| `getColorFormat` | `convertExtractedColor` |
| `getSwatchTypeColor` | `getSwatchColor` |
| `schemeFromSourceColor` | `createMaterialScheme` |
| `schemeFromDominantColor` | `createMaterialSchemesFromDominantColor` |
| `schemeFromPaletteColors` | `createMaterialSchemesFromPalette` |
| `schemeFromSwatchColors` | `createMaterialSchemesFromSwatches` |
| `schemeFromImageToColor` | `createMaterialSchemesFromImage` |
| `ARGB_CONVERTERS` | `ARGB_TO_COLOR_CONVERTERS` |
| `SWATCH_NAMES` | `SWATCH_ROLES` |
| `SCHEMES` | `MATERIAL_SCHEMES` |
| `ColorResult<Format>` | `ColorValue<Format>` |
| `SwatchVariant` | `SwatchRole` |
| `ThemeMode` | `SchemeMode` |
| `SchemeColors<Format>` / `SchemeResponse<Format>` | `MaterialSchemeColors<Format>` |
| `MaterialColorResponse<Format>` | `MaterialScheme<Format>` |
| `MaterialColorResponseMap` | `MaterialSchemeFormatMap` |
| `SwatchSchemeMap<Format>` | `SwatchMaterialSchemeMap<Format>` |
| `ColorExtractionType` | `ColorExtractionMode` |
| `ImageSchemeResultMap<Format>` | `MaterialSchemeResultsByExtractionMode<Format>` |
| `SchemeVariant` | `MaterialSchemeVariant` |
| `SchemeOptions` | `MaterialSchemeOptions` |
| `SchemeFormatOptions<Format>` | `MaterialSchemeFormatOptions<Format>` |
| `ImageSchemeOptions` | `MaterialSchemeImageOptions` |

The source template module now also calls its public function `renderTemplate`;
its previous `render` export remains an alias. The package export was already
named `renderTemplate` and is unchanged.

Use `extractionMode` instead of the deprecated image option `colorType`. If both
are supplied, `extractionMode` takes precedence. Return-property names such as
`sourceColor`, `colors`, `id`, and `name` are unchanged. Bare `ColorValue` still
means the union of all color representations. The legacy `SchemeResponse` alias
retains its hex default; specify a format when using `MaterialSchemeColors`.

## Source guide

Each module has file-level documentation and public API JSDoc for editor hover
help, including parameter ranges, defaults, return values, errors, and examples.
Only the package entry point is declared as a published import path.

| File | Responsibility |
| --- | --- |
| [`index.ts`](./index.ts) | Public functions, constants, and type exports |
| [`src/types.ts`](./src/types.ts) | Channel units, format lookup, swatch and role-first scheme types |
| [`src/convert.ts`](./src/convert.ts) | Conversion, validation, packing, and formatting |
| [`src/extract.ts`](./src/extract.ts) | Color Thief image adapters and swatch names |
| [`src/material.ts`](./src/material.ts) | Material roles, variants, generation options, and scheme factories |
| [`src/template.ts`](./src/template.ts) | Plain-text placeholders, sections, and loops |

## Development and examples

```sh
bun install
bun run typecheck  # check library types without emitting files
bun run build      # emit JS, source maps, declarations, and declaration maps
bun test           # execute tests
```

The TypeScript project includes the entry point and `src/`; examples and tests
are excluded from the production build. Output is written to `dist/`; package
JavaScript/type entry points target `dist/index.js` and `dist/index.d.ts`.

Run source examples individually:

```sh
bun run example:convert
bun run example:scheme
bun run example:template
bun run example:extract
```

- [`examples/convertColor.ts`](./examples/convertColor.ts): all formats,
  dedicated converters, channel packing, CSS formatting, and dispatch.
- [`examples/materialScheme.ts`](./examples/materialScheme.ts): roles, variants,
  formats, contrast, seed arrays, swatches, and image-based schemes.
- [`examples/renderTheme.ts`](./examples/renderTheme.ts): CSS custom properties,
  dynamic paths, object loops, truthy sections, and item aliases.
- [`examples/extractImage.ts`](./examples/extractImage.ts): dominant, palette,
  swatch, and image scheme extraction. Image examples read `images/1.png`.
