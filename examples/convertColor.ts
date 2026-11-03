/**
 * Conversion tour: `bun run example:convert` from the project root.
 * Prints typed channels, formatted text, round trips, and dedicated converters.
 * No image decoder is needed. The output label "CSS" is not applicable to ARGB:
 * formatColor(value, "argb") prints a decimal integer string, not a CSS color.
 * @module
 */
import {
  ARGB_TO_COLOR_CONVERTERS,
  argbToHex,
  argbToHsl,
  argbToHsla,
  argbToOklch,
  argbToRgb,
  argbToRgba,
  convertColorFromArgb,
  convertColorToArgb,
  formatColor,
  hexToArgb,
  hslToArgb,
  hslToRgb,
  oklchToArgb,
  oklchToRgb,
  rgbToArgb,
} from "../index";

const sourceHex = "#6750a4";
const sourceArgb = hexToArgb(sourceHex);
const formats = ["hex", "argb", "rgb", "rgba", "hsl", "hsla", "oklch"] as const;

console.log("Source:", sourceHex);
console.log("ARGB:", `0x${sourceArgb.toString(16).padStart(8, "0")}`);

for (const format of formats) {
  const color = convertColorFromArgb(sourceArgb, format);
  console.log(`${format}:`, color);
  console.log("  CSS:", formatColor(color, format));
  console.log("  round trip:", convertColorToArgb(color, format) === sourceArgb);
}

console.log("\nDedicated ARGB converters:");
console.log({ hex: argbToHex(sourceArgb), rgb: argbToRgb(sourceArgb), rgba: argbToRgba(sourceArgb) });
console.log({ hsl: argbToHsl(sourceArgb), hsla: argbToHsla(sourceArgb), oklch: argbToOklch(sourceArgb) });

const rgb = { r: 103, g: 80, b: 164 };
const rgba = { ...rgb, a: 0.5 };
const hsl = { h: 262.1, s: 34.1, l: 47.8 };
const hsla = { ...hsl, a: 0.5 };
const oklch = argbToOklch(sourceArgb);
console.log("\nObject-to-ARGB converters:");
console.log({
  rgb: rgbToArgb(rgb),
  rgba: rgbToArgb(rgba),
  hslRgb: hslToRgb(hsl),
  hsl: hslToArgb(hsl),
  hsla: hslToArgb(hsla),
  oklchRgb: oklchToRgb(oklch),
  oklch: oklchToArgb(oklch),
});

console.log("\nDispatch table:", Object.keys(ARGB_TO_COLOR_CONVERTERS));
