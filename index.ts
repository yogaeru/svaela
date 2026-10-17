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
} from "./src/convert";
export {
  getColorFormat,
  getSwatchTypeColor,
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
} from "./src/extract";
export {
  SCHEMES,
  schemeFromSourceColor,
  schemeFromDominantColor,
  schemeFromSwatchColors,
  schemeFromPaletteColors,
  schemeFromImageToColor,
} from "./src/material";
export type {
  SchemeName,
  SchemeOptions,
  ImageSchemeOptions,
  SchemeFormatOptions,
} from "./src/material";
export { SWATCH_NAMES, MATERIAL_ROLES, MaterialYouColors } from "./src/data";
export { render as renderTemplate } from "./src/template";
export type { TemplateData } from "./src/template";
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
} from "./src/types";
