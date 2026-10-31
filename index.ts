/**
 * Public API for color conversion, image extraction, Material 3 schemes, and
 * template rendering. Import from "svaela" rather than internal source paths.
 *
 * Naming conventions:
 * - `argbToRgb` / `convertColorToArgb`: conversions between representations.
 * - `extract…`: asynchronous image extraction; `getSwatchColor`: map lookup.
 * - `createMaterialScheme`: one seed; `createMaterialSchemesFrom…`: result arrays.
 * - `MaterialScheme…`: scheme types/options; `…Role`: semantic color categories.
 *
 * Schemes default to hex, tonalSpot, and contrast 0. Roles contain both modes:
 * `colors.primary.light`, not `colors.light.primary`. Generated roles are opaque.
 * Deprecated aliases retain the previous public names and their overloads.
 *
 * @example
 * import { createMaterialScheme, hexToArgb, formatColor } from "svaela";
 * const materialScheme = createMaterialScheme(hexToArgb("#6750a4"), { format: "rgb" });
 * const primaryColor = materialScheme.colors.primary.light;
 * const cssColor = formatColor(primaryColor, "rgb");
 * @module
 */
export {
  argbToHex,
  argbToRgb,
  argbToRgba,
  argbToHsl,
  argbToHsla,
  argbToHsv,
  argbToHsva,
  argbToOklch,
  hexToArgb,
  rgbToArgb,
  hslToRgb,
  hslToArgb,
  hsvToRgb,
  hsvToArgb,
  oklchToRgb,
  oklchToArgb,
  convertColorFromArgb,
  convertColorToArgb,
  formatColor,
  ARGB_TO_COLOR_CONVERTERS,
  ARGB_CONVERTERS,
} from "@/convert";
export {
  convertExtractedColor,
  getSwatchColor,
  extractDominantColor,
  extractPaletteColors,
  extractSwatchColors,
  SWATCH_ROLES,
  getColorFormat,
  getSwatchTypeColor,
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
  SWATCH_NAMES,
} from "@/extract";
export {
  MATERIAL_ROLES,
  MATERIAL_SCHEMES,
  createMaterialScheme,
  createMaterialSchemesFromDominantColor,
  createMaterialSchemesFromPalette,
  createMaterialSchemesFromSwatches,
  createMaterialSchemesFromImage,
  SCHEMES,
  schemeFromSourceColor,
  schemeFromDominantColor,
  schemeFromSwatchColors,
  schemeFromPaletteColors,
  schemeFromImageToColor,
} from "@/material";
export type {
  MaterialSchemeVariant,
  MaterialSchemeOptions,
  MaterialSchemeImageOptions,
  MaterialSchemeFormatOptions,
  SchemeVariant,
  SchemeOptions,
  ImageSchemeOptions,
  SchemeFormatOptions,
} from "@/material";
export { renderTemplate } from "@/template";
export type { TemplateData } from "@/template";
export type {
  RGB,
  RGBA,
  HSL,
  HSLA,
  HSV,
  HSVA,
  OKLCH,
  ImageSource,
  ColorFormat,
  ColorFormatMap,
  ColorValue,
  SwatchRole,
  SwatchColorMap,
  MaterialRole,
  SchemeMode,
  MaterialSchemeColors,
  MaterialScheme,
  MaterialSchemeResult,
  MaterialSchemeFormatMap,
  SwatchMaterialSchemeMap,
  ColorExtractionMode,
  MaterialSchemeResultsByExtractionMode,
  ColorResult,
  SwatchVariant,
  SchemeColors,
  SchemeResponse,
  MaterialColorResponse,
  MaterialColorResponseMap,
  SwatchSchemeMap,
  ColorExtractionType,
  ImageSchemeResultMap,
} from "@/types";
