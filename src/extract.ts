import { getColor, getPalette, getSwatches } from "colorthief";

import { convertColorFromArgb, rgbToArgb } from "./convert";
import { SWATCH_NAMES } from "./data";

import type { Color, ImageSource, SwatchMap, SwatchRole } from "colorthief";
import type { ColorFormat, ColorResult, SwatchColorMap } from "./types";

/** Convert an extracted sRGB color. Color Thief returns opaque colors. */
export function getColorFormat<K extends ColorFormat>(
  color: Color,
  format: K,
): ColorResult<K> {
  return convertColorFromArgb(rgbToArgb(color.rgb()), format);
}

export function getSwatchTypeColor<K extends ColorFormat>(
  swatches: SwatchMap,
  format: K,
  role: SwatchRole,
): ColorResult<K> | undefined {
  const swatch = swatches[role];
  return swatch ? getColorFormat(swatch.color, format) : undefined;
}

/** Return undefined when the image has no extractable colors. */
export async function getDominantColorFromImage<K extends ColorFormat>(
  source: ImageSource,
  format: K,
): Promise<ColorResult<K> | undefined> {
  const color = await getColor(source);
  return color ? getColorFormat(color, format) : undefined;
}

/** Include every swatch role; unavailable swatches have an undefined value. */
export async function getSwatchColorFromImage<K extends ColorFormat>(
  source: ImageSource,
  format: K,
): Promise<SwatchColorMap<K>> {
  const swatches = await getSwatches(source);
  return Object.fromEntries(
    SWATCH_NAMES.map((role) => [role, getSwatchTypeColor(swatches, format, role)]),
  ) as SwatchColorMap<K>;
}

/** Extract a color palette from an image. */
export async function getPaletteColorFromImage<K extends ColorFormat>(
  source: ImageSource,
  format: K,
  count = 3,
): Promise<ColorResult<K>[] | undefined> {
  if (!Number.isInteger(count) || count < 2 || count > 10) {
    throw new RangeError("Palette count must be an integer between 2 and 10");
  }
  const palette = await getPalette(source, { colorCount: count });
  return palette?.map((color) => getColorFormat(color, format));
}
