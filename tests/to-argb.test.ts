import { describe, expect, test } from "bun:test";
import { convertColorFromArgb, convertColorToArgb } from "../src/convert";
import type { ColorFormat } from "../src/types";

const formats: ColorFormat[] = [
  "hex",
  "argb",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "oklch",
];

describe("convertColorToArgb", () => {
  test.each(formats)("converts %s into an unsigned integer", (format) => {
    for (const seed of [0xff000000, 0xffffffff, 0xffff0000, 0xff123456]) {
      const result = convertColorToArgb(
        convertColorFromArgb(seed, format),
        format,
      );
      expect(result).toBe(seed);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  test("preserves alpha in alpha-capable formats", () => {
    for (const format of ["hex", "argb", "rgba", "hsla", "oklch"] as const) {
      for (const seed of [0, 0x00123456, 0x80123456, 0xff123456]) {
        expect(
          convertColorToArgb(convertColorFromArgb(seed, format), format),
        ).toBe(seed);
      }
    }
  });

  test("RGB and HSL default to opaque", () => {
    expect(convertColorToArgb({ r: 255, g: 0, b: 0 }, "rgb")).toBe(0xffff0000);
    expect(convertColorToArgb({ h: 0, s: 100, l: 50 }, "hsl")).toBe(0xffff0000);
  });

  test("normalizes signed ARGB and preserves zero", () => {
    expect(convertColorToArgb(-1, "argb")).toBe(0xffffffff);
    expect(convertColorToArgb(-2147483648, "argb")).toBe(0x80000000);
    expect(convertColorToArgb(0, "argb")).toBe(0);
  });

  test("delegates input validation to the converters", () => {
    expect(() => convertColorToArgb("invalid", "hex")).toThrow(TypeError);
    expect(() => convertColorToArgb(1.5, "argb")).toThrow(RangeError);
    expect(() => convertColorToArgb(0x100000000, "argb")).toThrow(RangeError);
    expect(() => convertColorToArgb({ r: -1, g: 0, b: 0 }, "rgb")).toThrow(
      RangeError,
    );
    expect(() =>
      convertColorToArgb({ r: 0, g: 0, b: 0, a: 2 }, "rgba"),
    ).toThrow(RangeError);
    expect(() => convertColorToArgb({ h: 0, s: 101, l: 50 }, "hsl")).toThrow(
      RangeError,
    );
    expect(() =>
      convertColorToArgb({ h: 0, s: 0, l: 50, a: -1 }, "hsla"),
    ).toThrow(RangeError);
    expect(() =>
      convertColorToArgb({ l: NaN, c: 0, h: 0, a: 1 }, "oklch"),
    ).toThrow(RangeError);
  });
});
