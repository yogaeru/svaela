/** Public API for color conversion, image extraction, and Material schemes. */
export {
  argbToHex,
  argbToRgb,
  argbToRgba,
  argbToHsl,
  argbToHsla,
  argbToOklch,
  hexToArgb,
  rgbToArgb,
  hslToRgb,
  hslToArgb,
  oklchToRgb,
  oklchToArgb,
  convertColorFromArgb,
  convertColorToArgb,
  formatColor,
  ARGB_CONVERTERS,
} from "@/convert";
export {
  getColorFormat,
  getSwatchTypeColor,
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
} from "@/extract";
export {
  SCHEMES,
  schemeFromSourceColor,
  schemeFromDominantColor,
  schemeFromSwatchColors,
  schemeFromPaletteColors,
  schemeFromImageToColor,
} from "@/attachment/color.js";
export type {
  SchemeName,
  SchemeOptions,
  ImageSchemeOptions,
  SchemeFormatOptions,
} from "@/attachment/color.js";
export { SWATCH_NAMES } from "@/extract.js";
export { MATERIAL_ROLES } from "@/attachment/color.js";
export { render as renderTemplate } from "@/template.js";
export type { TemplateData } from "@/template.js";
export type {
  RGB,
  RGBA,
  HSL,
  HSLA,
  OKLCH,
  ImageSource,
  ColorFormat,
  ColorFormatMap,
  ColorResult,
  SwatchName,
  SwatchColorMap,
  MaterialRole,
  SchemeColors,
  SchemeResponse,
  MaterialColorResponse,
  MaterialSchemeResult,
  MaterialColorResponseMap,
  SwatchSchemeMap,
  ColorExtractionType,
  ImageSchemeResultMap,
} from "@/types.js";
