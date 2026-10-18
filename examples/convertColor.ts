import {
  ARGB_CONVERTERS,
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

const source = "#6750a4";
const argb = hexToArgb(source);
const formats = ["hex", "argb", "rgb", "rgba", "hsl", "hsla", "oklch"] as const;

console.log("Source:", source);
console.log("ARGB:", `0x${argb.toString(16).padStart(8, "0")}`);

for (const format of formats) {
  const value = convertColorFromArgb(argb, format);
  console.log(`${format}:`, value);
  console.log("  CSS:", formatColor(value, format));
  console.log("  round trip:", convertColorToArgb(value, format) === argb);
}

console.log("\nDedicated ARGB converters:");
console.log({ hex: argbToHex(argb), rgb: argbToRgb(argb), rgba: argbToRgba(argb) });
console.log({ hsl: argbToHsl(argb), hsla: argbToHsla(argb), oklch: argbToOklch(argb) });

const rgb = { r: 103, g: 80, b: 164 };
const rgba = { ...rgb, a: 0.5 };
const hsl = { h: 262.1, s: 34.1, l: 47.8 };
const hsla = { ...hsl, a: 0.5 };
const oklch = argbToOklch(argb);
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

console.log("\nDispatch table:", Object.keys(ARGB_CONVERTERS));
