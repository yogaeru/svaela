# Colors

Typed color conversions, image color extraction, and Material 3 light/dark schemes.
Import the public API from `@/lib/colors` within this app. The module has no React
or app-specific imports; it uses the existing Color Thief and Material Color
Utilities dependencies.

## Modules

- `index.ts` — public functions, constants, and types.
- `channels.ts` / `types.ts` — channel units and format-dependent result types.
- `convert.ts` — conversion, validation, and CSS serialization.
- `extract.ts` — asynchronous Color Thief adapter.
- `material.ts` — Material scheme generation.
- `data.ts` — swatch names and Material role metadata.
- `template.ts` — optional plain-text template rendering.
- `__tests__/` — conversion, extraction, scheme, and type-contract tests.


## Formats and units

| Format | Value | Units |
| --- | --- | --- |
| `hex` | `string` | `#rrggbb`, or `#rrggbbaa` when nonopaque |
| `argb` | `number` | Unsigned packed `0xAARRGGBB` |
| `rgb` | `{ r, g, b }` | Channels 0–255 |
| `rgba` | `{ r, g, b, a }` | RGB plus alpha 0–1 |
| `hsl` | `{ h, s, l }` | Hue in degrees; saturation/lightness 0–100 |
| `hsla` | `{ h, s, l, a }` | HSL plus alpha 0–1 |
| `oklch` | `{ l, c, h, a }` | Lightness 0–1, raw nonnegative chroma, degree hue, alpha 0–1 |

RGB and HSL deliberately exclude alpha. Use RGBA/HSLA when transparency matters.
OKLCH includes alpha. Achromatic hue is zero. RGB/HSL/OKLCH results are channel
objects, not CSS strings: use `formatColor` for CSS output.

## Convert colors

```ts
import {
  hexToArgb,
  convertColorFromArgb,
  convertColorToArgb,
  argbToRgba,
  rgbToArgb,
  hslToArgb,
  oklchToArgb,
  formatColor,
} from "@/lib/colors";

const seed = hexToArgb("#6750a4");
const oklch = convertColorFromArgb(seed, "oklch"); // OKLCH, inferred
const css = formatColor(oklch, "oklch"); // oklch(... / 1)
const transparent = argbToRgba(hexToArgb("#f008"));
const integer = convertColorToArgb(transparent, "rgba"); // unsigned 0xAARRGGBB

rgbToArgb(transparent); // preserves alpha
hslToArgb({ h: 270, s: 50, l: 40 }); // opaque by default
oklchToArgb(oklch);
```

`convertColorToArgb(color, format)` accepts any supported format and returns an
unsigned ARGB integer. It preserves supplied alpha, defaults RGB/HSL to opaque,
and validates/normalizes existing ARGB integers.

Dedicated `argbToHex`, `argbToRgb`, `argbToRgba`, `argbToHsl`, `argbToHsla`, and
`argbToOklch` converters are also exported. `hslToRgb` and `oklchToRgb` produce
fractional RGB channels without alpha; their `*ToArgb` counterparts retain alpha.
Use packed ARGB as the interchange format when chaining conversions. Packing
rounds channels to 8-bit values; inverse OKLCH clips out-of-sRGB-gamut channels
rather than performing perceptual gamut mapping.

`hexToArgb` accepts exactly `#rgb`, `#rgba`, `#rrggbb`, and `#rrggbbaa`,
case-insensitively. Hex alpha is last; packed ARGB alpha is first. Signed 32-bit
ARGB inputs are accepted and normalized. Invalid/nonfinite channels throw;
finite hue wraps to 0–360 degrees. Other channels must be within their documented
ranges. `formatColor(value, "argb")` emits CSS `rgba()`, not a decimal integer.

## Extract image colors

```ts
import {
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
} from "@/lib/colors";

// image is a Color Thief ImageSource, e.g. HTMLImageElement or HTMLCanvasElement.
const dominant = await getDominantColorFromImage(image, "rgba");
const palette = await getPaletteColorFromImage(image, "oklch", 5);
const swatches = await getSwatchColorFromImage(image, "hex");
```

Palette size must be an integer from 2 to 20 (default 3). Dominant/palette return
`undefined` when no colors can be extracted. Swatch results include every
`SWATCH_NAMES` key, with `undefined` for unavailable roles. Extracted colors are
opaque: Color Thief does not preserve per-pixel alpha in palette colors.
Image loading/decoding errors propagate. Browser images must satisfy canvas/CORS
requirements; Node image loading may require Color Thief's optional decoder.

## Generate Material schemes

```ts
import { hexToArgb, schemeFromSourceColor, schemeFromImageToColor } from "@/lib/colors";

const theme = schemeFromSourceColor(hexToArgb("#6750a4"), {
  scheme: "tonalSpot",
  format: "oklch",
  contrastLevel: 0,
});
// theme.sourceColor: OKLCH
// theme.color.light.primary: OKLCH
// theme.color.dark.primary: OKLCH

const themes = await schemeFromImageToColor(image, {
  colorType: "palette",
  paletteSize: 5,
  scheme: "vibrant",
  format: "rgba",
  contrastLevel: 0.5,
}); // MaterialSchemeResult<"rgba">[] (never undefined)
// themes[0]: { id: "1", name: "Palette-1", sourceColor: RGBA,
//              color: { dark: SchemeColors<"rgba">, light: SchemeColors<"rgba"> } }
```

All formats work for both the source color and each generated role. Defaults are
`format: "hex"`, `scheme: "tonalSpot"`, and `contrastLevel: 0`; contrast must be
within -1..1. Scheme names are exported via `SCHEMES` and `SchemeName`.
Material scheme roles are opaque even when the seed has alpha.

- `schemeFromSourceColor`: one `MaterialColorResponse<K>`:
  `{ sourceColor, color: { dark, light } }`, without metadata or an array wrapper.
- `schemeFromDominantColor`: one-element `MaterialSchemeResult<K>[]`, with
  `id: "dominant"` and `name: "Dominant"`.
- `schemeFromPaletteColors`: `MaterialSchemeResult<K>[]` in input order, with
  one-based string IDs (`"1"`, `"2"`, …) and names (`"Palette-1"`, `"Palette-2"`, …).
  Duplicate seeds and zero-valued seeds are retained. Empty palettes return `[]`.
- `schemeFromSwatchColors`: `MaterialSchemeResult<K>[]` in `SWATCH_NAMES` order,
  with the swatch role as both `id` and `name`. Only `undefined` swatches are
  skipped; packed ARGB `0` is valid. Each available seed is generated once.
- `schemeFromImageToColor`: always `Promise<MaterialSchemeResult<K>[]>` for
  `"dominant"` (default), `"palette"`, and `"swatch"`. Empty images return `[]`
  in every mode. It forwards format, scheme, and contrast options.
- `schemeFromImage`: legacy `Promise<SchemeResponse<K> | undefined>` containing
  only `{ dark, light }` from the dominant color. Unlike `schemeFromImageToColor`,
  it still returns `undefined` when no color is available.

The dominant/palette/swatch seed helpers accept an options object or the legacy
`SchemeName` string as their second argument (hex output for the string form).
Image helpers and `schemeFromSourceColor` accept options objects.

`SchemeOptions` and `ImageSchemeOptions` are non-generic:

```ts
interface SchemeOptions {
  format?: ColorFormat;
  scheme?: SchemeName;
  contrastLevel?: number;
}
interface ImageSchemeOptions extends SchemeOptions {
  colorType?: ColorExtractionType;
  paletteSize?: number;
}
```

Overloads infer hex when the format is omitted, and precise values when a format
is explicitly supplied (e.g. `{ format: "rgba" }`). `SchemeFormatOptions<K>` is a
reusable options type with a **required** `format: K`; specifying a non-hex generic
without supplying its format is not supported. Broad `SchemeOptions` /
`ImageSchemeOptions` variables are also accepted, returning values typed with
`ColorFormat` rather than incorrectly promising hex:

```ts
import { schemeFromImageToColor, MaterialYouColors } from "@/lib/colors";
import type { ColorFormat, ImageSource, ImageSchemeOptions, MaterialSchemeResult } from "@/lib/colors";

async function loadSchemes(image: ImageSource, options: ImageSchemeOptions) {
  const schemes = await schemeFromImageToColor(image, options);
  const props: { schemes: readonly MaterialSchemeResult<ColorFormat>[]; format: ColorFormat } = {
    schemes,
    format: options.format ?? "hex",
  };
  return props;
}
// MaterialYouColors is the grouped role-description metadata, also exported at root.
```

`ImageSchemeResultMap<K>` now maps **all three** extraction modes to
`MaterialSchemeResult<K>[]`. `SwatchSchemeMap<K>` is retained only as a legacy
keyed-map type; no current scheme helper returns it. The entry point exports
`schemeFromDominantColor`, `MaterialSchemeResult`, `SchemeOptions`,
`ImageSchemeOptions`, `SchemeFormatOptions`, and `MaterialYouColors`, alongside
existing scheme APIs and types.

## Compatibility notes

- `argbToRgb` / `argbToHsl` no longer include `a`; use their RGBA/HSLA counterparts.
- Nonopaque `argbToHex` now preserves alpha with eight hex digits.
- Scheme role values now match the requested format instead of mixing CSS strings
  with objects or silently falling back to hex. Use `formatColor` to serialize.
- Dominant/palette/swatch schemes are now uniform arrays of flat
  `{ id, name, sourceColor, color: { dark, light } }` entries. Consume entries by
  iteration or `id`, not keyed swatch-map access or `entry.color.color`.
- Use `MaterialRole` (singular); the old `MaterialRoles` alias has been removed.
- `ConvertColorFunctions` remains a deprecated alias in `data.ts` for
  `ARGB_CONVERTERS`; use the latter from the public entry point.
- `renderTemplate` has no import-time demo/logging. It renders plain text and does
  not HTML-escape values; never inject untrusted output as HTML.

## Tests

Run `bun run test:colors`. Tests use deterministic color round trips and isolated
pixel-loader fixtures, with no network, DOM, or additional dependencies. The
compile-time contracts require a separate strict TypeScript check, since Bun
transpiles tests without type-checking:

```sh
bunx tsc --ignoreConfig --noEmit --strict --skipLibCheck --target es2023 --module esnext --moduleResolution bundler --verbatimModuleSyntax --noUnusedLocals --noUnusedParameters --types bun src/lib/colors/index.ts src/lib/colors/__tests__/*.ts
```
