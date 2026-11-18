# Color Conversion

## Overview

The conversion module handles packed ARGB, CSS hexadecimal, RGB(A), HSL(A), HSV(A), and OKLCH. Conversion functions require an explicit, case-sensitive format key; the library does not detect a format automatically.

Packed integers use `0xAARRGGBB`. Signed 32-bit values are accepted, and ARGB output is unsigned. Hex strings use CSS ordering, with alpha last (`#rrggbbaa`). RGB channels use 0–255, HSL/HSV hue uses degrees and saturation/lightness/value use percentages, and OKLCH uses unit lightness, raw nonnegative chroma, degree hue, and required alpha. Alpha is a fraction from 0 to 1.

RGB/HSL outputs without alpha discard alpha. RGB/HSL inputs without alpha are treated as opaque when packed. Packing rounds channels and alpha to 8-bit values. Hue wraps to `[0, 360)`. OKLCH-to-sRGB clips out-of-gamut channels rather than applying perceptual gamut mapping.

## How to Use

### Parse hex and convert formats

```ts
import { hexToArgb, convertColorFromArgb } from "svaela";

const seed = hexToArgb("#6750a4");
const rgba = convertColorFromArgb(seed, "rgba");
const oklch = convertColorFromArgb(seed, "oklch");
```

### Convert a value to ARGB

```ts
import { convertColorToArgb } from "svaela";

const argb = convertColorToArgb(
  { h: 270, s: 50, l: 40 },
  "hsl",
);
```

### Format a CSS color

```ts
import { convertColorFromArgb, formatColor } from "svaela";

const rgba = convertColorFromArgb(0x80ff0000, "rgba");
const css = formatColor(rgba, "rgba");
// rgba(255 0 0 / 0.5019607843137255)
```

`formatColor(value, "argb")` returns decimal text, not a CSS color. Convert ARGB to `rgba` before producing CSS.

## API Reference

### Dedicated ARGB converters

All functions below accept `argb: number` in signed or unsigned 32-bit `0xAARRGGBB` range and throw `RangeError` for a non-integer or out-of-range value.

| Function | Exact signature | Returns |
|---|---|---|
| `argbToRgb` | `argbToRgb(argb: number): RGB` | Integer RGB channels; alpha discarded. |
| `argbToRgba` | `argbToRgba(argb: number): RGBA` | RGB channels and alpha byte divided by 255. |
| `argbToHex` | `argbToHex(argb: number): string` | Lowercase `#rrggbb` or `#rrggbbaa`. |
| `argbToHsl` | `argbToHsl(argb: number): HSL` | HSL; alpha discarded. |
| `argbToHsla` | `argbToHsla(argb: number): HSLA` | HSL plus alpha. |
| `argbToHsv` | `argbToHsv(argb: number): HSV` | HSV; alpha discarded. |
| `argbToHsva` | `argbToHsva(argb: number): HSVA` | HSV plus alpha. |
| `argbToOklch` | `argbToOklch(argb: number): OKLCH` | OKLCH plus alpha. |

Example:

```ts
import { argbToHex, argbToHsl, argbToRgba } from "svaela";

argbToHex(0x80ff0000); // "#ff000080"
argbToRgba(0x80ff0000); // { r: 255, g: 0, b: 0, a: 128 / 255 }
argbToHsl(0xffff0000); // { h: 0, s: 100, l: 50 }
```

### Channel-to-ARGB converters

| Function | Exact signature | Parameters and behavior | Returns |
|---|---|---|---|
| `rgbToArgb` | `rgbToArgb(color: RGB \| RGBA): number` | `color`: finite RGB channels in 0–255; optional `a` in 0–1, default 1. | Unsigned ARGB; channels rounded to bytes. |
| `hslToRgb` | `hslToRgb(color: HSL \| HSLA): RGB` | `color`: finite hue, saturation/lightness in 0–100; optional alpha validated then discarded. | Fractional RGB channels. |
| `hslToArgb` | `hslToArgb(color: HSL \| HSLA): number` | Same HSL/HSLA input constraints. | Unsigned ARGB. |
| `hsvToRgb` | `hsvToRgb(color: HSV \| HSVA): RGB` | `color`: finite hue, saturation/value in 0–100; optional alpha validated then discarded. | Fractional RGB channels. |
| `hsvToArgb` | `hsvToArgb(color: HSV \| HSVA): number` | Same HSV/HSVA input constraints. | Unsigned ARGB. |
| `oklchToRgb` | `oklchToRgb(color: OKLCH): RGB` | `color`: `l` 0–1, nonnegative finite raw `c`, finite hue, required `a` 0–1. | Fractional RGB channels; out-of-gamut channels clipped. |
| `oklchToArgb` | `oklchToArgb(color: OKLCH): number` | Same OKLCH constraints. | Unsigned ARGB with byte-rounded alpha. |

All numeric channel validation failures throw `RangeError`. Hues are normalized to `[0, 360)` during conversion.

```ts
import { rgbToArgb, hslToRgb, oklchToArgb } from "svaela";

rgbToArgb({ r: 255, g: 0, b: 0 });
hslToRgb({ h: 360, s: 100, l: 50 });
oklchToArgb({ l: 0.6, c: 0.15, h: 270, a: 1 });
```

### `hexToArgb`

```ts
export function hexToArgb(hex: string): number;
```

Parses exactly `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa`, case-insensitively and without surrounding whitespace. Short forms are expanded; omitted alpha defaults to opaque. Alpha is moved from the final hex byte to the first ARGB byte.

| Name | Type | Default | Description |
|---|---|---|---|
| `hex` | `string` | — | One of the four supported CSS hex forms. |

Returns an unsigned packed ARGB number. Throws `TypeError` for malformed input.

```ts
hexToArgb("#f008"); // 0x88ff0000
```

### `ARGB_TO_COLOR_CONVERTERS`

```ts
export const ARGB_TO_COLOR_CONVERTERS: {
  [Format in keyof ColorFormatMap]: (argb: number) => ColorFormatMap[Format];
};
```

A format-keyed dispatch table for converting packed ARGB to each supported representation. Each function accepts `argb: number` and follows the validation, alpha, and units of its corresponding `argbTo...` converter.

| Name | Type | Default | Description |
|---|---|---|---|
| `argb` | `number` | — | Signed/unsigned packed 32-bit ARGB input. |

Returns a mapped color value. `ARGB_CONVERTERS` is a deprecated alias.

```ts
const hex = ARGB_TO_COLOR_CONVERTERS.hex(0xffff0000);
```

### `convertColorFromArgb`

```ts
export function convertColorFromArgb<Format extends ColorFormat>(
  argb: number,
  format: Format,
): ColorFormatMap[Format];
```

Converts packed ARGB to the representation selected by `format`.

| Name | Type | Default | Description |
|---|---|---|---|
| `argb` | `number` | — | Signed/unsigned 32-bit packed ARGB. |
| `format` | `Format extends ColorFormat` | — | Required output key. |

Returns `ColorFormatMap[Format]`; invalid packed values throw `RangeError`.

```ts
const hex = convertColorFromArgb(0xffff0000, "hex");
```

### `convertColorToArgb`

```ts
export function convertColorToArgb<Format extends keyof ColorFormatMap>(
  color: ColorFormatMap[Format],
  format: Format,
): number;
```

Converts a value whose shape is determined by `format` into unsigned packed ARGB. There is no automatic format detection.

| Name | Type | Default | Description |
|---|---|---|---|
| `color` | `ColorFormatMap[Format]` | — | Color value matching the selected format. |
| `format` | `Format` | — | Required input format key. |

Returns unsigned `0xAARRGGBB`. Malformed hex throws `TypeError`; invalid numeric values throw `RangeError`.

```ts
const argb = convertColorToArgb("#ff000080", "hex");
```

### `formatColor`

```ts
export function formatColor<Format extends keyof ColorFormatMap>(
  color: ColorFormatMap[Format],
  format: Format,
): string;
```

Serializes a color in its existing representation; it does not convert color spaces. Hex is validated and returned unchanged. RGB(A) preserves precision. HSL(A) and OKLCH non-alpha channels are rounded to two decimals. The ARGB format returns `String(color)` (decimal text), not CSS.

| Name | Type | Default | Description |
|---|---|---|---|
| `color` | `ColorFormatMap[Format]` | — | Value matching the format. |
| `format` | `Format` | — | Required serialization format. |

Returns a string. Invalid serialized object channels throw `RangeError`; malformed hex throws `TypeError`.

```ts
formatColor({ h: 270.1234, s: 50, l: 40 }, "hsl");
// "hsl(270.12 50% 40%)"
```

## Deprecated Exports

`ARGB_CONVERTERS` is an alias of `ARGB_TO_COLOR_CONVERTERS`. Prefer the canonical name.
