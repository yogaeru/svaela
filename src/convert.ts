/**
 * Typed conversions between sRGB, HSL, OKLCH, hexadecimal, and packed ARGB.
 *
 * Packed colors use unsigned `0xAARRGGBB`; signed 32-bit representations are
 * accepted too. RGB channels use 0..255 (fractions allowed), HSL uses degrees
 * and 0..100 percentages, and OKLCH uses unit lightness, nonnegative raw chroma,
 * and degrees. Alpha uses 0..1; RGB/HSL inputs without alpha are opaque, while
 * OKLCH requires `a`. Numeric channels must be finite and within their ranges.
 *
 * Conversions normalize hue to [0, 360). RGB output remains fractional until
 * packed into ARGB, where channels and alpha are rounded to bytes. OKLCH-to-RGB
 * clips out-of-gamut linear sRGB channels, rather than perceptually gamut-mapping.
 * RGB/HSL results omit alpha; RGBA/HSLA/OKLCH and hex retain it. Converting via
 * ARGB therefore introduces 8-bit quantization. Formatting is separate from
 * conversion and does not normalize hue or gamut-map OKLCH.
 *
 * @example
 * ```ts
 * import { convertColorToArgb, convertColorFromArgb, formatColor } from 'svaela';
 *
 * const packed = convertColorToArgb('#f008', 'hex');
 * const rgba = convertColorFromArgb(packed, 'rgba');
 * formatColor(rgba, 'rgba'); // 'rgba(255 0 0 / 0.5333333333333333)'
 * ```
 * @module
 */
import type { HSL, HSLA, HSV, HSVA, OKLCH, RGB, RGBA } from "./types";
import type { ColorFormatMap, ColorFormat } from "./types";

function validateFiniteNumber(value: number, channel: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${channel} must be finite`);
  }
  return value;
}

function validateRange(
  value: number,
  min: number,
  max: number,
  channel: string,
): number {
  validateFiniteNumber(value, channel);
  if (value < min || value > max) {
    throw new RangeError(`${channel} must be in ${min}..${max}`);
  }
  return value;
}

function normalizeHue(value: number): number {
  return ((validateFiniteNumber(value, "h") % 360) + 360) % 360;
}

function getAlpha(color: RGB | RGBA | HSL | HSLA | HSV | HSVA): number {
  return "a" in color ? validateRange(color.a, 0, 1, "a") : 1;
}

/** Accept signed or unsigned 32-bit 0xAARRGGBB and normalize to unsigned. */
function normalizeArgb(argb: number): number {
  validateRange(argb, -0x80000000, 0xffffffff, "argb");
  if (!Number.isInteger(argb)) {
    throw new RangeError("argb must be a 32-bit integer");
  }
  return argb >>> 0;
}

function validateRgb(color: RGB): void {
  validateRange(color.r, 0, 255, "r");
  validateRange(color.g, 0, 255, "g");
  validateRange(color.b, 0, 255, "b");
}

function validateHsl(color: HSL): void {
  validateFiniteNumber(color.h, "h");
  validateRange(color.s, 0, 100, "s");
  validateRange(color.l, 0, 100, "l");
}

function validateHsv(color: HSV): void {
  validateFiniteNumber(color.h, "h");
  validateRange(color.s, 0, 100, "s");
  validateRange(color.v, 0, 100, "v");
}

function validateOklch(color: OKLCH): void {
  validateRange(color.l, 0, 1, "l");
  validateFiniteNumber(color.c, "c");
  if (color.c < 0) throw new RangeError("c must be nonnegative");
  validateFiniteNumber(color.h, "h");
  validateRange(color.a, 0, 1, "a");
}

/**
 * Unpack sRGB channels, discarding alpha without compositing.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @returns An `RGB` object `{ r, g, b }` with integer channels in 0..255.
 * @throws {RangeError} If `argb` is nonfinite, noninteger, or outside -2^31..2^32-1.
 * @example
 * ```ts
 * import { argbToRgb } from 'svaela';
 * argbToRgb(0x80ff0000); // { r: 255, g: 0, b: 0 }
 * ```
 */
export function argbToRgb(argb: number): RGB {
  const value = normalizeArgb(argb);
  return {
    r: (value >>> 16) & 0xff,
    g: (value >>> 8) & 0xff,
    b: value & 0xff,
  };
}

/**
 * Unpack sRGB channels and alpha without compositing or premultiplication.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @returns An `RGBA` object with integer `r`, `g`, `b` in 0..255 and `a` equal
 * to the alpha byte divided by 255 (0..1).
 * @throws {RangeError} If `argb` is not an integer in -2^31..2^32-1.
 */
export function argbToRgba(argb: number): RGBA {
  const value = normalizeArgb(argb);
  return { ...argbToRgb(value), a: (value >>> 24) / 255 };
}

/**
 * Serialize packed ARGB as lowercase CSS hex, moving alpha to the end.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @returns `#rrggbb` for alpha 255; otherwise `#rrggbbaa`, including alpha zero.
 * @throws {RangeError} If `argb` is not an integer in -2^31..2^32-1.
 * @example
 * ```ts
 * import { argbToHex } from 'svaela';
 * argbToHex(0x80ff0000); // '#ff000080'
 * argbToHex(0xffff0000); // '#ff0000'
 * ```
 */
export function argbToHex(argb: number): string {
  const value = normalizeArgb(argb);
  const rgb = (value & 0xffffff).toString(16).padStart(6, "0");
  const a = value >>> 24;
  return `#${rgb}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}

/**
 * Convert packed sRGB to HSL without intermediate channel rounding.
 * Alpha is discarded without compositing; achromatic colors have hue zero.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @returns An `HSL` object `{ h, s, l }`: hue in [0, 360) degrees and saturation
 * and lightness in 0..100 percent, without decimal rounding.
 * @throws {RangeError} If `argb` is not an integer in -2^31..2^32-1.
 */
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
    h: normalizeHue(h * 60),
    s: Math.min(100, (delta / (1 - Math.abs(2 * l - 1))) * 100),
    l: l * 100,
  };
}

/**
 * Convert packed sRGB to HSL and retain alpha.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @returns An `HSLA` object with `h` in [0, 360) degrees, `s` and `l` in
 * 0..100 percent, and `a` equal to the alpha byte divided by 255. HSL channels
 * are not rounded; achromatic colors have hue zero.
 * @throws {RangeError} If `argb` is not an integer in -2^31..2^32-1.
 */
export function argbToHsla(argb: number): HSLA {
  return { ...argbToHsl(argb), a: argbToRgba(argb).a };
}

/**
 * Convert packed sRGB to HSV, discarding alpha without compositing.
 * @param argb - Unsigned 0xAARRGGBB or its signed 32-bit representation.
 * @returns Hue in [0, 360) degrees; saturation/value in 0..100 percent.
 * Achromatic colors have hue zero; black also has saturation zero.
 * @throws {RangeError} If argb is not an integer in -2^31..2^32-1.
 */
export function argbToHsv(argb: number): HSV {
  const rgb = argbToRgb(argb);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = (g - b) / delta;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return {
    h: normalizeHue(h * 60),
    s: max === 0 ? 0 : Math.min(100, (delta / max) * 100),
    v: max * 100,
  };
}

/**
 * Convert packed sRGB to HSV with alpha retained as a unit fraction.
 * @param argb - Signed/unsigned 32-bit 0xAARRGGBB.
 * @returns HSV channels from {@link argbToHsv}, plus a in 0..1.
 * @throws {RangeError} If argb is invalid.
 */
export function argbToHsva(argb: number): HSVA {
  return { ...argbToHsv(argb), a: argbToRgba(argb).a };
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  // Clip in linear sRGB before applying its transfer function.
  const clipped = Math.min(
    1,
    Math.max(0, validateFiniteNumber(value, "linear RGB channel")),
  );
  return (
    255 *
    (clipped <= 0.0031308
      ? 12.92 * clipped
      : 1.055 * clipped ** (1 / 2.4) - 0.055)
  );
}

/**
 * Convert packed sRGB to OKLCH, retaining alpha without decimal rounding.
 * Chroma below 1e-7 is treated as achromatic: both chroma and hue become zero.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @returns An `OKLCH` object `{ l, c, h, a }`: lightness clamped to 0..1,
 * nonnegative raw chroma (not a percentage), hue in [0, 360) degrees, and alpha
 * equal to the alpha byte divided by 255.
 * @throws {RangeError} If `argb` is not an integer in -2^31..2^32-1.
 */
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
    h: achromatic ? 0 : normalizeHue((Math.atan2(labB, a) * 180) / Math.PI),
    a: rgb.a,
  };
}

/**
 * Pack sRGB channels and optional alpha into unsigned ARGB.
 * @param color - `RGB` or `RGBA` with finite `r`, `g`, `b` in 0..255 and,
 * when present, finite `a` in 0..1. Omitted alpha defaults to 1.
 * @returns An unsigned `0xAARRGGBB` number. RGB channels and `a * 255` are
 * rounded with `Math.round`; channels are not clamped or premultiplied.
 * @throws {RangeError} If a channel is nonfinite or outside its range.
 * @example
 * ```ts
 * import { rgbToArgb } from 'svaela';
 * rgbToArgb({ r: 255, g: 0, b: 0, a: 0.5 }); // 0x80ff0000
 * ```
 */
export function rgbToArgb(color: RGB | RGBA): number {
  validateRgb(color);
  const a = Math.round(getAlpha(color) * 255);
  return (
    ((a << 24) |
      (Math.round(color.r) << 16) |
      (Math.round(color.g) << 8) |
      Math.round(color.b)) >>>
    0
  );
}

/**
 * Convert HSL to sRGB without rounding to bytes.
 * @param color - `HSL` or `HSLA`: finite hue in degrees (wrapped to [0, 360)),
 * saturation and lightness in 0..100 percent, and optional alpha in 0..1.
 * Supplied alpha is validated but discarded, not composited.
 * @returns An `RGB` object `{ r, g, b }` with fractional channels clamped to
 * 0..255 to contain floating-point drift.
 * @throws {RangeError} If a channel is nonfinite or outside its range.
 * @example
 * ```ts
 * import { hslToRgb } from 'svaela';
 * hslToRgb({ h: 360, s: 100, l: 50 }); // { r: 255, g: 0, b: 0 }
 * ```
 */
export function hslToRgb(color: HSL | HSLA): RGB {
  validateHsl(color);
  getAlpha(color);
  const h = normalizeHue(color.h) / 60;
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

/**
 * Convert HSL(A) to packed sRGB with byte-quantized alpha.
 * @param color - `HSL` or `HSLA`: finite hue in degrees (wrapped to [0, 360)),
 * `s` and `l` in 0..100 percent, and optional `a` in 0..1 (default 1).
 * @returns An unsigned `0xAARRGGBB` number, rounding converted RGB channels
 * and `a * 255` with `Math.round`.
 * @throws {RangeError} If a channel is nonfinite or outside its range.
 */
export function hslToArgb(color: HSL | HSLA): number {
  return rgbToArgb({ ...hslToRgb(color), a: getAlpha(color) });
}

/**
 * Convert HSV(A) to fractional sRGB without rounding to bytes.
 * @param color - Finite degree hue (wrapped), saturation/value in 0..100 percent,
 * and optional alpha in 0..1. Supplied alpha is validated but discarded.
 * @returns RGB channels in 0..255; floating-point drift is clamped.
 * @throws {RangeError} If a channel is nonfinite or outside its range.
 * @example
 * hsvToRgb({ h: 120, s: 100, v: 100 }); // { r: 0, g: 255, b: 0 }
 */
export function hsvToRgb(color: HSV | HSVA): RGB {
  validateHsv(color);
  getAlpha(color);
  const h = normalizeHue(color.h) / 60;
  const s = color.s / 100;
  const v = color.v / 100;
  const channel = (offset: number): number => {
    const position = (offset + h) % 6;
    const value =
      v * (1 - s * Math.max(0, Math.min(position, 4 - position, 1)));
    return Math.min(255, Math.max(0, value * 255));
  };
  return { r: channel(5), g: channel(3), b: channel(1) };
}

/**
 * Convert HSV(A) to unsigned 0xAARRGGBB, rounding RGB/alpha only when packing.
 * @param color - HSV degrees/percent with optional unit alpha (default 1).
 * @returns A packed sRGB integer; supplied alpha is preserved to byte precision.
 * @throws {RangeError} If a channel is nonfinite or outside its range.
 */
export function hsvToArgb(color: HSV | HSVA): number {
  return rgbToArgb({ ...hsvToRgb(color), a: getAlpha(color) });
}

/**
 * Convert OKLCH to sRGB, clipping each out-of-gamut linear RGB channel to 0..1
 * before applying the sRGB transfer function; this is not perceptual gamut mapping.
 * @param color - `OKLCH` with finite `l` in 0..1, nonnegative finite raw `c`,
 * finite degree `h` (wrapped to [0, 360)), and required `a` in 0..1.
 * Alpha is validated but discarded without compositing.
 * @returns An `RGB` object `{ r, g, b }` with fractional channels in 0..255;
 * no integer rounding is applied.
 * @throws {RangeError} If a channel is invalid or conversion overflows to a
 * nonfinite linear RGB channel.
 */
export function oklchToRgb(color: OKLCH): RGB {
  validateOklch(color);
  const angle = (normalizeHue(color.h) * Math.PI) / 180;
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

/**
 * Convert OKLCH to packed sRGB with byte-quantized alpha.
 * Out-of-gamut linear RGB channels are clipped, not perceptually gamut-mapped.
 * @param color - `OKLCH` with finite `l` in 0..1, nonnegative finite raw `c`,
 * finite degree `h` (wrapped to [0, 360)), and required `a` in 0..1.
 * @returns An unsigned `0xAARRGGBB` number, rounding converted RGB channels
 * and `a * 255` with `Math.round`.
 * @throws {RangeError} If a channel is invalid or conversion produces a
 * nonfinite linear RGB channel.
 */
export function oklchToArgb(color: OKLCH): number {
  return rgbToArgb({ ...oklchToRgb(color), a: color.a });
}

/**
 * Parse CSS hex into packed ARGB; no other CSS color syntax is accepted.
 * @param hex - Exactly `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa`, ignoring
 * letter case but allowing no surrounding whitespace. Alpha is last, not first.
 * @returns An unsigned `0xAARRGGBB` number. Short digits are doubled, and
 * omitted alpha defaults to 255 (opaque); no numeric rounding is needed.
 * @throws {TypeError} If the value is not a string in one of the accepted forms.
 * @example
 * ```ts
 * import { hexToArgb } from 'svaela';
 * hexToArgb('#f008'); // 0x88ff0000
 * ```
 */
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

/**
 * Conversion functions keyed by `hex`, `argb`, `rgb`, `rgba`, `hsl`, `hsla`,
 * and `oklch`. Each accepts signed or unsigned packed `0xAARRGGBB` and returns
 * the corresponding `ColorFormatMap` value; `argb` normalizes to unsigned.
 * Invalid packed numbers throw `RangeError`. Alpha and units follow the named
 * conversion functions, such as {@link argbToRgba} and {@link argbToOklch}.
 */
export const ARGB_TO_COLOR_CONVERTERS: {
  [Format in keyof ColorFormatMap]: (argb: number) => ColorFormatMap[Format];
} = {
  hex: argbToHex,
  argb: normalizeArgb,
  rgb: argbToRgb,
  rgba: argbToRgba,
  hsl: argbToHsl,
  hsla: argbToHsla,
  hsv: argbToHsv,
  hsva: argbToHsva,
  oklch: argbToOklch,
};

/**
 * Convert packed ARGB to a format selected by a typed key.
 * @param argb - Unsigned `0xAARRGGBB` or its signed 32-bit representation.
 * @param format - Required output key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`; there is no default.
 * @returns The corresponding `ColorFormatMap[Format]`: a hex string, unsigned ARGB
 * number, or channel object. RGB uses 0..255; HSL uses degrees/percent; OKLCH
 * uses unit lightness/raw chroma/degrees. Alpha is omitted for RGB/HSL, otherwise
 * retained in hex or as a unit fraction. No additional rounding is applied.
 * @throws {RangeError} If `argb` is not an integer in -2^31..2^32-1.
 * @example
 * ```ts
 * import { convertColorFromArgb } from 'svaela';
 * convertColorFromArgb(-65536, 'hex'); // '#ff0000'
 * convertColorFromArgb(0xffff0000, 'hsla'); // { h: 0, s: 100, l: 50, a: 1 }
 * ```
 */
export function convertColorFromArgb<Format extends ColorFormat>(
  argb: number,
  format: Format,
): ColorFormatMap[Format] {
  switch (format) {
    case "hex":
      return argbToHex(argb) as ColorFormatMap[Format];
    case "argb":
      return normalizeArgb(argb) as ColorFormatMap[Format];
    case "rgb":
      return argbToRgb(argb) as ColorFormatMap[Format];
    case "rgba":
      return argbToRgba(argb) as ColorFormatMap[Format];
    case "hsl":
      return argbToHsl(argb) as ColorFormatMap[Format];
    case "hsla":
      return argbToHsla(argb) as ColorFormatMap[Format];
    case "hsv":
      return argbToHsv(argb) as ColorFormatMap[Format];
    case "hsva":
      return argbToHsva(argb) as ColorFormatMap[Format];
    case "oklch":
      return argbToOklch(argb) as ColorFormatMap[Format];
  }
}

const COLOR_TO_ARGB_CONVERTERS: {
  [Format in keyof ColorFormatMap]: (color: ColorFormatMap[Format]) => number;
} = {
  hex: hexToArgb,
  argb: normalizeArgb,
  rgb: rgbToArgb,
  rgba: rgbToArgb,
  hsl: hslToArgb,
  hsla: hslToArgb,
  hsv: hsvToArgb,
  hsva: hsvToArgb,
  oklch: oklchToArgb,
};

/**
 * Convert a typed color to packed sRGB ARGB.
 * @param color - Value matching `format`: strict CSS hex; signed/unsigned ARGB;
 * RGB(A) with channels in 0..255; HSL(A) in degrees/0..100 percent; or OKLCH
 * with `l` in 0..1, nonnegative raw `c`, degree `h`, and required `a` in 0..1.
 * Object channels must be finite. RGB/HSL alpha defaults to 1 when absent.
 * @param format - Required input key: `hex`, `argb`, `rgb`, `rgba`, `hsl`,
 * `hsla`, or `oklch`; it selects the parser, not automatic format detection.
 * @returns An unsigned `0xAARRGGBB` number. Hues wrap to [0, 360); OKLCH
 * out-of-gamut linear RGB channels are clipped. RGB and alpha are rounded to
 * bytes, so supplied alpha is preserved only to 8-bit precision.
 * @throws {TypeError} If a hex input is not exactly `#rgb`, `#rgba`, `#rrggbb`,
 * or `#rrggbbaa` (no surrounding whitespace).
 * @throws {RangeError} If numeric input is invalid or OKLCH conversion produces
 * a nonfinite linear RGB channel. Packed ARGB must be an integer in -2^31..2^32-1.
 * @example
 * ```ts
 * import { convertColorToArgb } from 'svaela';
 * convertColorToArgb({ h: -120, s: 100, l: 50 }, 'hsl'); // 0xff0000ff
 * ```
 */
export function convertColorToArgb<Format extends keyof ColorFormatMap>(
  color: ColorFormatMap[Format],
  format: Format,
): number {
  return COLOR_TO_ARGB_CONVERTERS[format](color);
}

const COLOR_FORMATTERS: {
  [Format in keyof ColorFormatMap]: (color: ColorFormatMap[Format]) => string;
} = {
  hex: (color) => {
    hexToArgb(color);
    return color;
  },
  argb: (color) => String(color),
  rgb: (color) => {
    validateRgb(color);
    return `rgb(${color.r} ${color.g} ${color.b})`;
  },
  rgba: (color) => {
    validateRgb(color);
    validateRange(color.a, 0, 1, "a");
    return `rgba(${color.r} ${color.g} ${color.b} / ${color.a})`;
  },
  hsl: (color) => {
    validateHsl(color);
    const h = Number(color.h.toFixed(2));
    const s = Number(color.s.toFixed(2));
    const l = Number(color.l.toFixed(2));
    return `hsl(${h} ${s}% ${l}%)`;
  },
  hsla: (color) => {
    validateHsl(color);
    validateRange(color.a, 0, 1, "a");
    const h = Number(color.h.toFixed(2));
    const s = Number(color.s.toFixed(2));
    const l = Number(color.l.toFixed(2));
    return `hsla(${h} ${s}% ${l}% / ${color.a})`;
  },
  hsv: (color) => COLOR_FORMATTERS.rgb(hsvToRgb(color)),
  hsva: (color) => COLOR_FORMATTERS.rgba({ ...hsvToRgb(color), a: color.a }),
  oklch: (color) => {
    validateOklch(color);
    const l = Number(color.l.toFixed(2));
    const c = Number(color.c.toFixed(2));
    const h = Number(color.h.toFixed(2));
    return `oklch(${l} ${c} ${h} / ${color.a})`;
  },
};

/**
 * Serialize a color in its existing format, without converting color spaces.
 *
 * Hex is validated and returned unchanged. RGB(A) uses space-separated channels
 * and slash alpha, preserving numeric precision. HSL(A) and OKLCH round each
 * non-alpha channel to two decimal places and omit trailing zeros; alpha is
 * unchanged. Hues are validated as finite but not wrapped. OKLCH is not clipped
 * or gamut-mapped. **`argb` returns `String(color)` (decimal), not CSS**, and
 * does not validate the number; convert to `rgba` first when CSS is needed.
 *
 * @param color - Value matching `format`. RGB channels use 0..255, HSL uses
 * degrees/0..100 percent, OKLCH uses unit lightness/nonnegative raw chroma/degrees,
 * and explicit alpha uses 0..1. RGBA, HSLA, and OKLCH require alpha.
 * @param format - Required key: `hex`, `argb`, `rgb`, `rgba`, `hsl`, `hsla`, or
 * `oklch`; there is no default or automatic detection.
 * @returns A hex, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`, or
 * `oklch(...)` string, or the decimal representation for `argb`.
 * @throws {TypeError} If hex is not exactly `#rgb`, `#rgba`, `#rrggbb`, or
 * `#rrggbbaa`, without surrounding whitespace.
 * @throws {RangeError} If a serialized object channel is nonfinite or outside
 * its range. Alpha is neither read nor validated for `rgb` and `hsl`.
 * @example
 * ```ts
 * import { convertColorFromArgb, formatColor } from 'svaela';
 * formatColor(convertColorFromArgb(0x80ff0000, 'rgba'), 'rgba');
 * // 'rgba(255 0 0 / 0.5019607843137255)'
 * formatColor(0xffff0000, 'argb'); // '4294901760' (not CSS)
 * ```
 */
export function formatColor<Format extends keyof ColorFormatMap>(
  color: ColorFormatMap[Format],
  format: Format,
): string {
  return COLOR_FORMATTERS[format](color);
}

/** @deprecated Use {@link ARGB_TO_COLOR_CONVERTERS}. */
export { ARGB_TO_COLOR_CONVERTERS as ARGB_CONVERTERS };
