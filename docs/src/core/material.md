# Material Scheme

## Overview

The material module builds Material 3 color schemes using `@material/material-color-utilities`. It can generate schemes from one packed ARGB seed, arrays of palette seeds, named swatches, or an image. Every scheme contains all `MATERIAL_ROLES` with both light and dark values. The structure is role-first: `colors.primary.light`, not `colors.light.primary`.

Defaults are `format: "hex"`, `scheme: "tonalSpot"`, and `contrastLevel: 0`. Supported variants are `content`, `vibrant`, `rainbow`, `neutral`, `fidelity`, `tonalSpot`, `fruitSalad`, `expressive`, and `monochrome`. Source alpha is retained only in output formats that support alpha; generated Material role colors are opaque.

## How to Use

### Generate from a seed

```ts
import { createMaterialScheme, hexToArgb } from "svaela";

const theme = createMaterialScheme(hexToArgb("#6750a4"), {
  format: "oklch",
  scheme: "tonalSpot",
  contrastLevel: 0,
});

console.log(theme.colors.primary.light);
console.log(theme.colors.primary.dark);
```

### Generate multiple schemes from seeds

```ts
import { createMaterialSchemesFromPalette } from "svaela";

const themes = createMaterialSchemesFromPalette(
  [0xff6750a4, 0xff006874],
  { format: "hex", scheme: "vibrant" },
);

for (const theme of themes) {
  console.log(theme.id, theme.name, theme.colors.primary.dark);
}
```

### Generate from an image

```ts
import { createMaterialSchemesFromImage } from "svaela";

const themes = await createMaterialSchemesFromImage("./photo.png", {
  extractionMode: "palette",
  paletteSize: 5,
  format: "hex",
});
```

For browser image objects, use the synchronous `createMaterialSchemesFromImageSync` variant.

## API Reference

### Constants and option types

#### `MATERIAL_ROLES`

```ts
export const MATERIAL_ROLES = [
  "background", "on_background", "surface", "surface_dim", "surface_bright",
  "surface_container_lowest", "surface_container_low", "surface_container",
  "surface_container_high", "surface_container_highest", "on_surface",
  "on_surface_variant", "outline", "outline_variant", "inverse_surface",
  "inverse_on_surface", "primary", "primary_dim", "on_primary",
  "primary_container", "on_primary_container", "primary_fixed",
  "primary_fixed_dim", "on_primary_fixed", "on_primary_fixed_variant",
  "inverse_primary", "secondary", "secondary_dim", "on_secondary",
  "secondary_container", "on_secondary_container", "secondary_fixed",
  "secondary_fixed_dim", "on_secondary_fixed", "on_secondary_fixed_variant",
  "tertiary", "tertiary_dim", "on_tertiary", "tertiary_container",
  "on_tertiary_container", "tertiary_fixed", "tertiary_fixed_dim",
  "on_tertiary_fixed", "on_tertiary_fixed_variant", "error", "error_dim",
  "on_error", "error_container", "on_error_container",
] as const satisfies readonly MaterialRole[];
```

The constant lists all semantic role keys in the order used in generated maps. It has no parameters and returns a readonly tuple. The full union is documented in [Types & Interfaces](../reference/types.md#materialrole).

#### `MATERIAL_SCHEMES`

```ts
export const MATERIAL_SCHEMES = {
  content: SchemeContent,
  vibrant: SchemeVibrant,
  rainbow: SchemeRainbow,
  neutral: SchemeNeutral,
  fidelity: SchemeFidelity,
  tonalSpot: SchemeTonalSpot,
  fruitSalad: SchemeFruitSalad,
  expressive: SchemeExpressive,
  monochrome: SchemeMonochrome,
} as const;
```

Maps each `MaterialSchemeVariant` key to its upstream Material scheme constructor. `tonalSpot` is the default.

#### `MaterialSchemeOptions`

```ts
export interface MaterialSchemeOptions {
  format?: ColorFormat;
  scheme?: MaterialSchemeVariant;
  contrastLevel?: number;
}
```

| Property | Type | Default | Description |
|---|---|---|---|
| `format` | `ColorFormat` | `"hex"` | Output format for source and role colors. |
| `scheme` | `MaterialSchemeVariant` | `"tonalSpot"` | Material scheme algorithm. |
| `contrastLevel` | `number` | `0` | Finite value from `-1` (reduced) to `1` (increased). |

#### `MaterialSchemeFormatOptions<Format>`

```ts
export interface MaterialSchemeFormatOptions<Format extends ColorFormat>
  extends MaterialSchemeOptions {
  format: Format;
}
```

Requires an explicit `format` property, allowing overloads to infer the matching output type.

#### `MaterialSchemeImageOptions`

```ts
export interface MaterialSchemeImageOptions extends MaterialSchemeOptions {
  extractionMode?: ColorExtractionMode;
  colorType?: ColorExtractionMode;
  paletteSize?: number;
}
```

| Property | Type | Default | Description |
|---|---|---|---|
| `extractionMode` | `ColorExtractionMode` | `"dominant"` | Selects `dominant`, `palette`, or `swatch` extraction. |
| `colorType` | `ColorExtractionMode` | — | Deprecated alias; `extractionMode` takes precedence. |
| `paletteSize` | `number` | `3` | Integer 2–20; relevant only in palette mode. |

### `createMaterialScheme`

```ts
export function createMaterialScheme(
  sourceArgb: number,
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialScheme<"hex">;

export function createMaterialScheme<Format extends ColorFormat>(
  sourceArgb: number,
  options: MaterialSchemeFormatOptions<Format>,
): MaterialScheme<Format>;

export function createMaterialScheme(
  sourceArgb: number,
  options: MaterialSchemeOptions,
): MaterialScheme<ColorFormat>;
```

Generates all Material roles for one signed/unsigned packed ARGB seed.

| Name | Type | Default | Description |
|---|---|---|---|
| `sourceArgb` | `number` | — | 32-bit `0xAARRGGBB` seed. |
| `options` | `MaterialSchemeOptions` | `{}` | Format, scheme variant, and contrast settings. |

Returns `{ sourceColor, colors }` as `MaterialScheme<Format>`. Invalid seed or contrast throws `RangeError`; a missing upstream role throws `Error`.

```ts
const theme = createMaterialScheme(0xff6750a4);
```

### `createMaterialSchemesFromDominantColor`

```ts
export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromDominantColor<Format extends ColorFormat>(
  sourceArgb: number,
  options: MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];

export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  scheme: MaterialSchemeVariant,
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  options: MaterialSchemeInput,
): MaterialSchemeResult<ColorFormat>[];
```

Wraps one seed as a one-element result array. It does not perform image extraction.

| Name | Type | Default | Description |
|---|---|---|---|
| `sourceArgb` | `number` | — | Packed ARGB seed. |
| `options` / `scheme` | `MaterialSchemeOptions \| MaterialSchemeVariant` | `{}` | Generation options or variant shorthand. |

Returns one result with `id: "dominant"` and `name: "Dominant"`.

```ts
const [result] = createMaterialSchemesFromDominantColor(0xff6750a4);
```

### `createMaterialSchemesFromPalette`

```ts
export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromPalette<Format extends ColorFormat>(
  paletteArgb: readonly number[],
  options: MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];

export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  scheme: MaterialSchemeVariant,
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  options: MaterialSchemeInput,
): MaterialSchemeResult<ColorFormat>[];
```

Generates one result for every seed, preserving order and duplicates. IDs are 1-based strings (`"1"`, `"2"`, ...); names are `Palette-1`, `Palette-2`, etc.

| Name | Type | Default | Description |
|---|---|---|---|
| `paletteArgb` | `readonly number[]` | — | Array of signed/unsigned packed ARGB seeds. |
| `options` / `scheme` | `MaterialSchemeOptions \| MaterialSchemeVariant` | `{}` | Generation options or variant shorthand. |

Returns an array; an empty input returns `[]`. There is no palette-size limit for this function.

```ts
const themes = createMaterialSchemesFromPalette([0xff6750a4, 0xff006874]);
```

### `createMaterialSchemesFromSwatches`

```ts
export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromSwatches<Format extends ColorFormat>(
  swatchArgb: SwatchColorMap<"argb">,
  options: MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];

export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  scheme: MaterialSchemeVariant,
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  options: MaterialSchemeInput,
): MaterialSchemeResult<ColorFormat>[];
```

Generates schemes for defined swatch seeds in `SWATCH_ROLES` order. Missing (`undefined`) swatches are skipped; ARGB zero is a valid seed. Each result uses the swatch role as both `id` and `name`.

| Name | Type | Default | Description |
|---|---|---|---|
| `swatchArgb` | `SwatchColorMap<"argb">` | — | Six swatch keys mapped to ARGB numbers or `undefined`. |
| `options` / `scheme` | `MaterialSchemeOptions \| MaterialSchemeVariant` | `{}` | Generation options or variant shorthand. |

Returns an array, possibly empty.

```ts
const themes = createMaterialSchemesFromSwatches(argbSwatches, "tonalSpot");
```

### `createMaterialSchemesFromImage`

```ts
export function createMaterialSchemesFromImage(
  imageSource: ImageSource,
  options?: MaterialSchemeImageOptions & { format?: "hex" },
): Promise<MaterialSchemeResult<"hex">[]>;

export function createMaterialSchemesFromImage<Format extends ColorFormat>(
  imageSource: ImageSource,
  options: MaterialSchemeImageOptions & MaterialSchemeFormatOptions<Format>,
): Promise<MaterialSchemeResult<Format>[]>;

export function createMaterialSchemesFromImage(
  imageSource: ImageSource,
  options: MaterialSchemeImageOptions,
): Promise<MaterialSchemeResult<ColorFormat>[]>;
```

Extracts seeds using the selected strategy and creates a result for each. `dominant` yields at most one result; `palette` preserves extraction order; `swatch` follows `SWATCH_ROLES` order.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `ImageSource` | — | Supported Color Thief image source. |
| `options` | `MaterialSchemeImageOptions` | `{}` | Extraction strategy and scheme settings. |

Returns a promise of an array, possibly empty. Palette size is validated in palette mode; contrast is validated when a seed is generated. Image and extraction errors reject the promise.

```ts
const themes = await createMaterialSchemesFromImage("./photo.png", {
  extractionMode: "palette",
  paletteSize: 4,
  format: "hex",
});
```

### `createMaterialSchemesFromImageSync`

```ts
export function createMaterialSchemesFromImageSync(
  imageSource: BrowserSource,
  options?: MaterialSchemeImageOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];

export function createMaterialSchemesFromImageSync<Format extends ColorFormat>(
  imageSource: BrowserSource,
  options: MaterialSchemeImageOptions & MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];

export function createMaterialSchemesFromImageSync(
  imageSource: BrowserSource,
  options: MaterialSchemeImageOptions,
): MaterialSchemeResult<ColorFormat>[];
```

Synchronous browser counterpart of `createMaterialSchemesFromImage`.

| Name | Type | Default | Description |
|---|---|---|---|
| `imageSource` | `BrowserSource` | — | Browser source supported by synchronous Color Thief extraction. |
| `options` | `MaterialSchemeImageOptions` | `{}` | Extraction strategy and scheme settings. |

Returns an array, possibly empty. Extraction, validation, and scheme errors are thrown synchronously.

```ts
const themes = createMaterialSchemesFromImageSync(imageElement, {
  extractionMode: "dominant",
});
```

## Deprecated Exports

| Deprecated export | Canonical export |
|---|---|
| `SCHEMES` | `MATERIAL_SCHEMES` |
| `SchemeVariant` | `MaterialSchemeVariant` |
| `SchemeOptions` | `MaterialSchemeOptions` |
| `SchemeFormatOptions` | `MaterialSchemeFormatOptions` |
| `ImageSchemeOptions` | `MaterialSchemeImageOptions` |
| `schemeFromSourceColor` | `createMaterialScheme` |
| `schemeFromDominantColor` | `createMaterialSchemesFromDominantColor` |
| `schemeFromPaletteColors` | `createMaterialSchemesFromPalette` |
| `schemeFromSwatchColors` | `createMaterialSchemesFromSwatches` |
| `schemeFromImageToColor` | `createMaterialSchemesFromImage` |

Use `extractionMode` instead of deprecated `colorType`; when both are provided, `extractionMode` takes precedence.
