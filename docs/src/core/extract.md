# Image Extraction

## Overview

The extraction module wraps Color Thief and converts its RGB results into `svaela` color formats. It supports dominant-color extraction, ordered palettes, and six named swatch roles. The asynchronous functions accept `ImageSource`; synchronous variants accept Color Thief's `BrowserSource`.

In Node.js, path and Buffer inputs require the optional `sharp` loader. Browser inputs must be ready and canvas-readable; cross-origin restrictions can cause errors. A string is treated as a local source by the loader, not fetched as a URL. Extraction errors propagate. No color is represented by `undefined` for dominant/palette results; swatch extraction always returns all six keys, with missing values set to `undefined`.

Extracted pixels are opaque. Source pixel alpha is not preserved. RGB is rounded to byte channels before conversion, so alpha-bearing output has alpha `1`.

## How to Use

### Extract a dominant color

```ts
import { extractDominantColor } from "svaela";

const dominant = await extractDominantColor("./photo.png", "hex");
if (dominant !== undefined) console.log(dominant);
```

### Extract a palette

```ts
import { extractPaletteColors } from "svaela";

const palette = await extractPaletteColors("./photo.png", "rgb", 5);
for (const color of palette ?? []) {
  console.log(color.r, color.g, color.b);
}
```

`paletteSize` is an integer from 2 through 20 and defaults to 3. Color Thief may return fewer colors than requested.

### Extract semantic swatches

```ts
import { extractSwatchColors, SWATCH_ROLES } from "svaela";

const swatches = await extractSwatchColors("./photo.png", "hex");
for (const role of SWATCH_ROLES) {
  console.log(role, swatches[role]);
}
```

### Use an existing Color Thief result

```ts
import { convertExtractedColor, getSwatchColor } from "svaela";

// `color` and `swatches` are values obtained from Color Thief.
const hex = convertExtractedColor(color, "hex");
const vibrant = getSwatchColor(swatches, "hex", "Vibrant");
```

## API Reference

All format parameters are required and accept `ColorFormat`: `hex`, `argb`, `rgb`, `rgba`, `hsl`, `hsla`, `hsv`, `hsva`, or `oklch`.

### `SWATCH_ROLES`

```ts
export const SWATCH_ROLES = [
  "Vibrant", "DarkVibrant", "LightVibrant",
  "Muted", "DarkMuted", "LightMuted",
] as const;
```

The ordered six swatch keys used by extraction and scheme generation. No parameters; returns a readonly tuple.

### `convertExtractedColor`

```ts
export function convertExtractedColor<Format extends ColorFormat>(
  color: Color,
  format: Format,
): ColorValue<Format>;
```

Converts a Color Thief `Color` using its `rgb()` channels. Source alpha and other metadata are ignored; RGB is byte-rounded and output is opaque.

| Name | Type | Default | Description |
|---|---|---|---|
| `color` | `Color` (from `colorthief`) | — | Color Thief color instance. |
| `format` | `Format extends ColorFormat` | — | Required output representation. |

Returns `ColorValue<Format>`. Throws `RangeError` for invalid RGB channels.

```ts
const hex = convertExtractedColor(color, "hex");
```

### `getSwatchColor`

```ts
export function getSwatchColor<Format extends ColorFormat>(
  swatches: SwatchMap,
  format: Format,
  role: ColorThiefSwatchRole,
): ColorValue<Format> | undefined;
```

Reads one existing Color Thief swatch and converts it. It does not load or extract an image.

| Name | Type | Default | Description |
|---|---|---|---|
| `swatches` | `SwatchMap` | — | Color Thief swatch map. |
| `format` | `Format extends ColorFormat` | — | Required output format. |
| `role` | `ColorThiefSwatchRole` | — | Swatch key to read. |

Returns the converted color, or `undefined` when that swatch is unavailable.

```ts
const vibrant = getSwatchColor(swatches, "hex", "Vibrant");
```

### `extractDominantColor`

```ts
export async function extractDominantColor<Format extends ColorFormat>(
  imageSource: ImageSource,
  format: Format,
): Promise<ColorValue<Format> | undefined>;
```

Asynchronously extracts the dominant color using Color Thief defaults.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `ImageSource` | — | Supported path, Buffer, or browser image source. |
| `format` | `Format extends ColorFormat` | — | Required output format. |

Returns a promise resolving to a color or `undefined`. Loading, decoding, dependency, canvas-security, and conversion errors reject the promise.

```ts
const dominant = await extractDominantColor("./photo.png", "hex");
```

### `extractDominantColorSync`

```ts
export function extractDominantColorSync<Format extends ColorFormat>(
  imageSource: BrowserSource,
  format: Format,
): ColorValue<Format> | undefined;
```

Synchronously extracts a dominant color from a browser source.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `BrowserSource` | — | Synchronously supported browser image source. |
| `format` | `Format extends ColorFormat` | — | Required output format. |

Returns a color or `undefined` if no color is available. Extraction and conversion errors are thrown synchronously.

```ts
const dominant = extractDominantColorSync(imageElement, "hex");
```

### `extractSwatchColors`

```ts
export async function extractSwatchColors<Format extends ColorFormat>(
  imageSource: ImageSource,
  format: Format,
): Promise<SwatchColorMap<Format>>;
```

Asynchronously extracts all six semantic swatches.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `ImageSource` | — | Supported image source. |
| `format` | `Format extends ColorFormat` | — | Required output format. |

Returns a promise of a map containing every `SwatchRole`; unavailable swatches have `undefined` values.

```ts
const swatches = await extractSwatchColors("./photo.png", "rgba");
```

### `extractSwatchColorsSync`

```ts
export function extractSwatchColorsSync<Format extends ColorFormat>(
  imageSource: BrowserSource,
  format: Format,
): SwatchColorMap<Format>;
```

Synchronous browser counterpart of `extractSwatchColors`.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `BrowserSource` | — | Synchronously supported browser source. |
| `format` | `Format extends ColorFormat` | — | Required output format. |

Returns all six swatch keys, each containing a color or `undefined`.

```ts
const swatches = extractSwatchColorsSync(imageElement, "hex");
```

### `extractPaletteColors`

```ts
export async function extractPaletteColors<Format extends ColorFormat>(
  imageSource: ImageSource,
  format: Format,
  paletteSize = 3,
): Promise<ColorValue<Format>[] | undefined>;
```

Asynchronously extracts an ordered palette. The requested count is validated before image loading.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `ImageSource` | — | Supported image source. |
| `format` | `Format extends ColorFormat` | — | Required output format. |
| `paletteSize` | `number` | `3` | Integer in the range 2–20. |

Returns a promise of an ordered color array, or `undefined` if no palette is available. The array can be shorter than requested. Invalid size throws `RangeError`; extraction errors reject the promise.

```ts
const palette = await extractPaletteColors("./photo.png", "hex", 5);
```

### `extractPaletteColorsSync`

```ts
export function extractPaletteColorsSync<Format extends ColorFormat>(
  imageSource: BrowserSource,
  format: Format,
  paletteSize = 3,
): ColorValue<Format>[] | undefined;
```

Synchronous browser counterpart of `extractPaletteColors`.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `BrowserSource` | — | Synchronously supported browser source. |
| `format` | `Format extends ColorFormat` | — | Required output format. |
| `paletteSize` | `number` | `3` | Integer in the range 2–20. |

Returns a color array or `undefined`. Invalid size and extraction errors are thrown synchronously.

```ts
const palette = extractPaletteColorsSync(imageElement, "hex", 5);
```

## Deprecated Exports

The following aliases remain exported for compatibility. Prefer their canonical names:

| Deprecated export | Canonical export |
|---|---|
| `SWATCH_NAMES` | `SWATCH_ROLES` |
| `getColorFormat` | `convertExtractedColor` |
| `getSwatchTypeColor` | `getSwatchColor` |
| `getDominantColorFromImage` | `extractDominantColor` |
| `getPaletteColorFromImage` | `extractPaletteColors` |
| `getSwatchColorFromImage` | `extractSwatchColors` |
