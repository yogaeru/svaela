/**
 * Asynchronous image color extraction backed by Color Thief, with results typed
 * by the required format key: `hex`, `argb`, `rgb`, `rgba`, `hsl`, `hsla`, or
 * `oklch`. Results are strings, unsigned `0xAARRGGBB` numbers, or channel objects
 * respectively. RGB uses 0..255, HSL uses degrees/0..100 percent, and OKLCH uses
 * unit lightness, raw chroma, and degrees. Alpha-bearing results are opaque.
 *
 * `ImageSource` supports browser HTMLImageElement, HTMLCanvasElement,
 * HTMLVideoElement, ImageData, ImageBitmap, and OffscreenCanvas, or Node.js file
 * path strings and Buffers. These are platform-dependent: the default Node
 * loader requires `sharp`; browser sources must be ready and canvas-readable
 * (including cross-origin permissions). Strings are not fetched as URLs here.
 *
 * The wrappers use Color Thief's default extraction settings, apart from the
 * palette count. They expose no per-call sampling, filtering, loader, or gamut
 * options; Color Thief's global configuration can still affect extraction.
 * Its current defaults use sRGB output, OKLCH quantization, and quality 10
 * (sampling every tenth pixel), initially filtering near-white and low-alpha
 * pixels but relaxing those filters if no samples remain. Fully transparent
 * input therefore does not necessarily produce an empty result.
 *
 * Extracted RGB is packed through ARGB before conversion: fractional channels
 * are rounded to bytes, source pixel alpha is not retained, and output HSL and
 * OKLCH receive no decimal rounding. Load, decode, canvas-security, dependency,
 * and conversion errors propagate; absence of a color is not an error.
 *
 * @example
 * ```ts
 * import { extractDominantColor } from 'svaela';
 *
 * // Node.js, with sharp installed:
 * const color = await extractDominantColor('./photo.png', 'hex');
 * if (color !== undefined) console.log(color);
 * ```
 * @module
 */
import { getColor, getPalette, getSwatches } from "colorthief";

import { convertColorFromArgb, rgbToArgb } from "./convert";
/** The six semantic swatch keys, in the order used to build swatch results. */
export const SWATCH_ROLES = [
  "Vibrant",
  "DarkVibrant",
  "LightVibrant",
  "Muted",
  "DarkMuted",
  "LightMuted",
] as const;

import type {
  Color,
  ImageSource,
  SwatchMap,
  SwatchRole as ColorThiefSwatchRole,
} from "colorthief";
import type { ColorFormat, ColorValue, SwatchColorMap } from "./types";

/**
 * Convert a Color Thief color's RGB channels to a svaela format.
 * Only `color.rgb()` is read; source alpha and other color metadata are not used.
 * @param color - A Color Thief `Color` whose `rgb()` returns finite sRGB
 * `{ r, g, b }` channels in 0..255.
 * @param format - Required output key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`; there is no default.
 * @returns `ColorValue<Format>`: a hex string, unsigned ARGB number, or channel
 * object. RGB is rounded to bytes before conversion; HSL uses degrees/percent,
 * OKLCH uses unit lightness/raw chroma/degrees. Alpha-bearing output has alpha 1
 * (255 in ARGB); hex omits opaque alpha. HSL/OKLCH are not decimal-rounded.
 * @throws {RangeError} If an RGB channel is nonfinite or outside 0..255.
 */
export function convertExtractedColor<Format extends ColorFormat>(
  color: Color,
  format: Format,
): ColorValue<Format> {
  return convertColorFromArgb(rgbToArgb(color.rgb()), format);
}

/**
 * Select one semantic swatch and convert its color without extracting an image.
 * @param swatches - A Color Thief `SwatchMap`; unavailable entries are null.
 * @param format - Required output key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`.
 * @param role - `Vibrant`, `DarkVibrant`, `LightVibrant`, `Muted`, `DarkMuted`,
 * or `LightMuted`.
 * @returns The selected `ColorValue<Format>`, or `undefined` when the role has no
 * swatch. Conversion uses {@link convertExtractedColor}: byte-rounded RGB, opaque
 * alpha, and unrounded HSL/OKLCH channels.
 * @throws {RangeError} If the selected swatch's RGB channels are invalid.
 */
export function getSwatchColor<Format extends ColorFormat>(
  swatches: SwatchMap,
  format: Format,
  role: ColorThiefSwatchRole,
): ColorValue<Format> | undefined {
  const swatch = swatches[role];
  return swatch ? convertExtractedColor(swatch.color, format) : undefined;
}

/**
 * Extract the dominant color using Color Thief's default extraction settings.
 * @param imageSource - A platform-supported `ImageSource`: a Node.js file path or
 * Buffer, or a browser image, canvas, video, ImageData, ImageBitmap, or
 * OffscreenCanvas. See the module notes for loader and cross-origin requirements.
 * @param format - Required output key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`; there is no default.
 * @returns A promise of `ColorValue<Format>`, or `undefined` if Color Thief returns
 * no color. Output is opaque and converted via byte-rounded sRGB; RGB/HSL omit
 * alpha, while RGBA/HSLA/OKLCH contain `a: 1`. HSL and OKLCH are not decimal-rounded.
 * @throws Propagates image loading/decoding, missing-loader/dependency,
 * canvas-security, and conversion errors as promise rejections.
 * @example
 * ```ts
 * import { extractDominantColor } from 'svaela';
 * const dominant = await extractDominantColor('./photo.png', 'rgb');
 * if (dominant) console.log(dominant.r, dominant.g, dominant.b);
 * ```
 */
export async function extractDominantColor<Format extends ColorFormat>(
  imageSource: ImageSource,
  format: Format,
): Promise<ColorValue<Format> | undefined> {
  const colorThiefColor = await getColor(imageSource);
  return colorThiefColor
    ? convertExtractedColor(colorThiefColor, format)
    : undefined;
}

/**
 * Extract colors classified into six semantic swatch roles, not a ranked palette.
 * Uses Color Thief's default swatch extraction settings.
 * @param imageSource - A platform-supported `ImageSource`: a Node.js file path or
 * Buffer, or a browser image, canvas, video, ImageData, ImageBitmap, or
 * OffscreenCanvas. See the module notes for loading requirements.
 * @param format - Required output key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`; there is no default.
 * @returns A promise of `SwatchColorMap<Format>` containing all six keys: `Vibrant`,
 * `DarkVibrant`, `LightVibrant`, `Muted`, `DarkMuted`, `LightMuted`. Each value
 * is a `ColorValue<Format>` or `undefined` for an unavailable swatch; the map itself
 * is never `undefined`. Colors are opaque, with byte-rounded RGB and no decimal
 * rounding of HSL/OKLCH; see {@link convertExtractedColor} for units.
 * @throws Propagates image loading/decoding, dependency, canvas-security,
 * extraction, and conversion errors as promise rejections.
 * @example
 * ```ts
 * import { extractSwatchColors } from 'svaela';
 * const swatches = await extractSwatchColors('./photo.png', 'hex');
 * if (swatches.Vibrant !== undefined) console.log(swatches.Vibrant);
 * ```
 */
export async function extractSwatchColors<Format extends ColorFormat>(
  imageSource: ImageSource,
  format: Format,
): Promise<SwatchColorMap<Format>> {
  const colorThiefSwatches = await getSwatches(imageSource);
  return Object.fromEntries(
    SWATCH_ROLES.map((role) => [
      role,
      getSwatchColor(colorThiefSwatches, format, role),
    ]),
  ) as SwatchColorMap<Format>;
}

/**
 * Extract a palette using Color Thief's default settings and a requested size.
 * @param imageSource - A platform-supported `ImageSource`: a Node.js file path or
 * Buffer, or a browser image, canvas, video, ImageData, ImageBitmap, or
 * OffscreenCanvas. See the module notes for loading requirements.
 * @param format - Required output key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`; there is no default format.
 * @param paletteSize - Requested maximum number of colors, an integer in 2..20;
 * defaults to 3. The extracted palette can contain fewer colors.
 * @returns A promise of `ColorValue<Format>[]` in Color Thief's palette order, or
 * `undefined` when it returns no palette. Each color is opaque and converted
 * through byte-rounded sRGB; HSL/OKLCH channels are not decimal-rounded.
 * See {@link convertExtractedColor} for output shapes and units.
 * @throws {RangeError} Rejects if `paletteSize` is not an integer in 2..20; validation
 * happens before image loading.
 * @throws Propagates image loading/decoding, dependency, canvas-security,
 * extraction, and conversion errors as promise rejections.
 * @example
 * ```ts
 * import { extractPaletteColors } from 'svaela';
 * const palette = await extractPaletteColors('./photo.png', 'hex', 5);
 * for (const hex of palette ?? []) console.log(hex);
 * ```
 */
export async function extractPaletteColors<Format extends ColorFormat>(
  imageSource: ImageSource,
  format: Format,
  paletteSize = 3,
): Promise<ColorValue<Format>[] | undefined> {
  if (!Number.isInteger(paletteSize) || paletteSize < 2 || paletteSize > 20) {
    throw new RangeError("Palette count must be an integer between 2 and 20");
  }
  const colorThiefPalette = await getPalette(imageSource, {
    colorCount: paletteSize,
  });
  return colorThiefPalette?.map((color) =>
    convertExtractedColor(color, format),
  );
}

/** @deprecated Use {@link SWATCH_ROLES}. */
export { SWATCH_ROLES as SWATCH_NAMES };

/** @deprecated Use {@link convertExtractedColor}. */
export { convertExtractedColor as getColorFormat };

/** @deprecated Use {@link getSwatchColor}. */
export { getSwatchColor as getSwatchTypeColor };

/** @deprecated Use {@link extractDominantColor}. */
export { extractDominantColor as getDominantColorFromImage };

/** @deprecated Use {@link extractPaletteColors}. */
export { extractPaletteColors as getPaletteColorFromImage };

/** @deprecated Use {@link extractSwatchColors}. */
export { extractSwatchColors as getSwatchColorFromImage };
