import type { HSL, HSLA, OKLCH, RGB, RGBA } from "./types";
import type { ColorFormatMap } from "./types";

export type { HSL, HSLA, OKLCH, RGB, RGBA } from "./types";

function finite(value: number, channel: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${channel} must be finite`);
  }
  return value;
}

function range(
  value: number,
  min: number,
  max: number,
  channel: string,
): number {
  finite(value, channel);
  if (value < min || value > max) {
    throw new RangeError(`${channel} must be in ${min}..${max}`);
  }
  return value;
}

function hue(value: number): number {
  return ((finite(value, "h") % 360) + 360) % 360;
}

function alpha(color: RGB | RGBA | HSL | HSLA): number {
  return "a" in color ? range(color.a, 0, 1, "a") : 1;
}

/** Accept signed or unsigned 32-bit 0xAARRGGBB and normalize to unsigned. */
function normalizeArgb(argb: number): number {
  range(argb, -0x80000000, 0xffffffff, "argb");
  if (!Number.isInteger(argb)) {
    throw new RangeError("argb must be a 32-bit integer");
  }
  return argb >>> 0;
}

function validateRgb(color: RGB): void {
  range(color.r, 0, 255, "r");
  range(color.g, 0, 255, "g");
  range(color.b, 0, 255, "b");
}

function validateHsl(color: HSL): void {
  finite(color.h, "h");
  range(color.s, 0, 100, "s");
  range(color.l, 0, 100, "l");
}

function validateOklch(color: OKLCH): void {
  range(color.l, 0, 1, "l");
  finite(color.c, "c");
  if (color.c < 0) throw new RangeError("c must be nonnegative");
  finite(color.h, "h");
  range(color.a, 0, 1, "a");
}

/** Extract sRGB channels in 0..255 from 0xAARRGGBB. */
export function argbToRgb(argb: number): RGB {
  const value = normalizeArgb(argb);
  return {
    r: (value >>> 16) & 0xff,
    g: (value >>> 8) & 0xff,
    b: value & 0xff,
  };
}

/** Extract sRGB channels and alpha in 0..1 from 0xAARRGGBB. */
export function argbToRgba(argb: number): RGBA {
  const value = normalizeArgb(argb);
  return { ...argbToRgb(value), a: (value >>> 24) / 255 };
}

/** Serialize as #rrggbb, or #rrggbbaa when nonopaque. */
export function argbToHex(argb: number): string {
  const value = normalizeArgb(argb);
  const rgb = (value & 0xffffff).toString(16).padStart(6, "0");
  const a = value >>> 24;
  return `#${rgb}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}

/** Convert to HSL degrees/percent without intermediate channel rounding. */
export function argbToHsl(argb: number): HSL {
  const rgb = argbToRgb(argb);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l: l * 100 };

  let h: number;
  if (max === r) h = (g - b) / delta;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  return {
    h: hue(h * 60),
    s: Math.min(100, (delta / (1 - Math.abs(2 * l - 1))) * 100),
    l: l * 100,
  };
}

/** Convert to HSL degrees/percent and preserve alpha in 0..1. */
export function argbToHsla(argb: number): HSLA {
  return { ...argbToHsl(argb), a: argbToRgba(argb).a };
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  // Clip in linear sRGB before applying its transfer function.
  const clipped = Math.min(1, Math.max(0, finite(value, "linear RGB channel")));
  return (
    255 *
    (clipped <= 0.0031308
      ? 12.92 * clipped
      : 1.055 * clipped ** (1 / 2.4) - 0.055)
  );
}

/** Convert to OKLCH (unit lightness, raw chroma, degree hue, unit alpha). */
export function argbToOklch(argb: number): OKLCH {
  const rgb = argbToRgba(argb);
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, labB);
  // Rounded OKLab matrices leave tiny chroma on neutral sRGB colors.
  const achromatic = chroma < 1e-7;
  return {
    l: Math.min(1, Math.max(0, lightness)),
    c: achromatic ? 0 : chroma,
    h: achromatic ? 0 : hue((Math.atan2(labB, a) * 180) / Math.PI),
    a: rgb.a,
  };
}

/** Pack RGB(A) as unsigned 0xAARRGGBB, rounding only at this boundary. */
export function rgbToArgb(color: RGB | RGBA): number {
  validateRgb(color);
  const a = Math.round(alpha(color) * 255);
  return (
    ((a << 24) |
      (Math.round(color.r) << 16) |
      (Math.round(color.g) << 8) |
      Math.round(color.b)) >>>
    0
  );
}

/** Convert HSL degrees/percent to fractional sRGB channels in 0..255. */
export function hslToRgb(color: HSL | HSLA): RGB {
  validateHsl(color);
  alpha(color);
  const h = hue(color.h) / 60;
  const s = color.s / 100;
  const l = color.l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 1) {
    r = c;
    g = x;
  } else if (h < 2) {
    r = x;
    g = c;
  } else if (h < 3) {
    g = c;
    b = x;
  } else if (h < 4) {
    g = x;
    b = c;
  } else if (h < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return {
    r: Math.min(255, Math.max(0, (r + m) * 255)),
    g: Math.min(255, Math.max(0, (g + m) * 255)),
    b: Math.min(255, Math.max(0, (b + m) * 255)),
  };
}

/** Pack HSL(A) as unsigned 0xAARRGGBB, preserving alpha when supplied. */
export function hslToArgb(color: HSL | HSLA): number {
  return rgbToArgb({ ...hslToRgb(color), a: alpha(color) });
}

/** Convert OKLCH to fractional sRGB channels, clipping out-of-gamut channels. */
export function oklchToRgb(color: OKLCH): RGB {
  validateOklch(color);
  const angle = (hue(color.h) * Math.PI) / 180;
  const a = color.c * Math.cos(angle);
  const b = color.c * Math.sin(angle);
  const l = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** Pack OKLCH as unsigned 0xAARRGGBB, preserving its required alpha. */
export function oklchToArgb(color: OKLCH): number {
  return rgbToArgb({ ...oklchToRgb(color), a: color.a });
}

/** Parse exactly #rgb, #rgba, #rrggbb, or #rrggbbaa into 0xAARRGGBB. */
export function hexToArgb(hex: string): number {
  if (
    typeof hex !== "string" ||
    hex !== hex.trim() ||
    !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)
  ) {
    throw new TypeError("Expected #rgb, #rgba, #rrggbb, or #rrggbbaa");
  }
  const digits = hex.slice(1);
  const expanded =
    digits.length <= 4
      ? Array.from(digits, (digit) => digit + digit).join("")
      : digits;
  const rgb = Number.parseInt(expanded.slice(0, 6), 16);
  const a =
    expanded.length === 8 ? Number.parseInt(expanded.slice(6), 16) : 255;
  return ((a << 24) | rgb) >>> 0;
}

/** Typed conversion dispatch from packed ARGB to each supported format. */
export const ARGB_CONVERTERS: {
  [K in keyof ColorFormatMap]: (argb: number) => ColorFormatMap[K];
} = {
  hex: argbToHex,
  argb: normalizeArgb,
  rgb: argbToRgb,
  rgba: argbToRgba,
  hsl: argbToHsl,
  hsla: argbToHsla,
  oklch: argbToOklch,
};

export function convertColorFromArgb<K extends keyof typeof ARGB_CONVERTERS>(
  argb: number,
  format: K,
): ColorFormatMap[K] {
  return ARGB_CONVERTERS[format](argb);
}

const TO_ARGB_CONVERTERS: {
  [K in keyof ColorFormatMap]: (color: ColorFormatMap[K]) => number;
} = {
  hex: hexToArgb,
  argb: normalizeArgb,
  rgb: rgbToArgb,
  rgba: rgbToArgb,
  hsl: hslToArgb,
  hsla: hslToArgb,
  oklch: oklchToArgb,
};

/** Convert a supported color to unsigned 0xAARRGGBB, preserving supplied alpha. */
export function convertColorToArgb<K extends keyof ColorFormatMap>(
  color: ColorFormatMap[K],
  format: K,
): number {
  return TO_ARGB_CONVERTERS[format](color);
}

const CSS_FORMATTERS: {
  [K in keyof ColorFormatMap]: (color: ColorFormatMap[K]) => string;
} = {
  hex: (color) => {
    hexToArgb(color);
    return color;
  },
  argb: (color) => CSS_FORMATTERS.rgba(argbToRgba(color)),
  rgb: (color) => {
    validateRgb(color);
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  },
  rgba: (color) => {
    validateRgb(color);
    range(color.a, 0, 1, "a");
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  },
  hsl: (color) => {
    validateHsl(color);
    return `hsl(${hue(color.h)}, ${color.s}, ${color.l})`;
  },
  hsla: (color) => {
    validateHsl(color);
    range(color.a, 0, 1, "a");
    return `hsla(${hue(color.h)}, ${color.s}, ${color.l}, ${color.a})`;
  },
  oklch: (color) => {
    validateOklch(color);
    return `oklch(${color.l}, ${color.c}, ${hue(color.h)}, ${color.a})`;
  },
};

/** Serialize a typed color as CSS; packed ARGB is serialized as rgba(). */
export function formatColor<K extends keyof ColorFormatMap>(
  color: ColorFormatMap[K],
  format: K,
): string {
  return CSS_FORMATTERS[format](color);
}
