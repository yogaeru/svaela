import { describe, expect, test } from "bun:test";
import {
  ARGB_CONVERTERS,
  argbToHex,
  argbToHsl,
  argbToHsla,
  argbToOklch,
  argbToRgb,
  argbToRgba,
  convertColorFromArgb,
  formatColor,
  hexToArgb,
  hslToArgb,
  hslToRgb,
  oklchToArgb,
  oklchToRgb,
  rgbToArgb,
} from "../src/convert";
import type { HSL, OKLCH, RGB } from "../src/channels";

const references = [
  { hex: "#000000", rgb: { r: 0, g: 0, b: 0 }, hsl: { h: 0, s: 0, l: 0 } },
  {
    hex: "#ffffff",
    rgb: { r: 255, g: 255, b: 255 },
    hsl: { h: 0, s: 0, l: 100 },
  },
  { hex: "#ff0000", rgb: { r: 255, g: 0, b: 0 }, hsl: { h: 0, s: 100, l: 50 } },
  {
    hex: "#ffff00",
    rgb: { r: 255, g: 255, b: 0 },
    hsl: { h: 60, s: 100, l: 50 },
  },
  {
    hex: "#00ff00",
    rgb: { r: 0, g: 255, b: 0 },
    hsl: { h: 120, s: 100, l: 50 },
  },
  {
    hex: "#00ffff",
    rgb: { r: 0, g: 255, b: 255 },
    hsl: { h: 180, s: 100, l: 50 },
  },
  {
    hex: "#0000ff",
    rgb: { r: 0, g: 0, b: 255 },
    hsl: { h: 240, s: 100, l: 50 },
  },
  {
    hex: "#ff00ff",
    rgb: { r: 255, g: 0, b: 255 },
    hsl: { h: 300, s: 100, l: 50 },
  },
];

describe("reference conversions and channel shapes", () => {
  test.each(references)("RGB/HSL reference $hex", ({ hex, rgb, hsl }) => {
    const argb = hexToArgb(hex);
    expect(argbToRgb(argb)).toEqual(rgb);
    expect(argbToHex(rgbToArgb(rgb))).toBe(hex);
    expect(argbToHsl(argb)).toEqual(hsl);
    expect(hslToRgb(hsl)).toEqual(rgb);
    expect(hslToArgb(hsl)).toBe(argb);
  });

  test("RGB/HSL omit alpha while RGBA/HSLA/OKLCH preserve it", () => {
    const argb = 0x80123456;
    expect(Object.keys(argbToRgb(argb)).sort()).toEqual(["b", "g", "r"]);
    expect(Object.keys(argbToRgba(argb)).sort()).toEqual(["a", "b", "g", "r"]);
    expect(Object.keys(argbToHsl(argb)).sort()).toEqual(["h", "l", "s"]);
    expect(Object.keys(argbToHsla(argb)).sort()).toEqual(["a", "h", "l", "s"]);
    expect(Object.keys(argbToOklch(argb)).sort()).toEqual(["a", "c", "h", "l"]);
    expect(argbToRgba(argb).a).toBe(128 / 255);
    expect(argbToHsla(argb).a).toBe(128 / 255);
    expect(argbToOklch(argb).a).toBe(128 / 255);
    expect(hslToRgb({ h: 0, s: 100, l: 50, a: 0 })).toEqual({
      r: 255,
      g: 0,
      b: 0,
    });
    expect(Object.keys(oklchToRgb(argbToOklch(argb))).sort()).toEqual([
      "b",
      "g",
      "r",
    ]);
  });

  test.each([
    ["#ff0000", 0.627955, 0.257683, 29.233885],
    ["#00ff00", 0.86644, 0.294827, 142.495339],
    ["#0000ff", 0.452014, 0.313214, 264.052021],
  ] as const)("OKLCH reference %s", (hex, l, c, h) => {
    const actual = argbToOklch(hexToArgb(hex));
    expect(actual.l).toBeCloseTo(l, 5);
    expect(actual.c).toBeCloseTo(c, 5);
    expect(actual.h).toBeCloseTo(h, 4);
    expect(actual.a).toBe(1);
  });

  test.each([0, 1, 64, 128, 254, 255])(
    "neutral %i has canonical zero chroma/hue",
    (channel) => {
      const argb = rgbToArgb({ r: channel, g: channel, b: channel });
      expect(argbToOklch(argb).c).toBe(0);
      expect(argbToOklch(argb).h).toBe(0);
      expect(argbToHsl(argb).s).toBe(0);
      expect(argbToHsl(argb).h).toBe(0);
      expect(argbToHsl(argb).l).toBeCloseTo((channel / 255) * 100, 10);
    },
  );

  test("fractional channels round only when packed; alpha defaults to opaque", () => {
    expect(rgbToArgb({ r: 12.49, g: 127.5, b: 254.9, a: 0.5 })).toBe(
      0x800c80ff,
    );
    expect(rgbToArgb({ r: 12, g: 128, b: 255 })).toBe(0xff0c80ff);
    expect(hslToRgb({ h: 30, s: 100, l: 50 }).g).toBe(127.5);
    expect(hslToArgb({ h: 30, s: 100, l: 50, a: 0 })).toBe(0x00ff8000);
  });

  test.each([-720, -360, 0, 360, 720])("hue wraps %i degrees", (offset) => {
    expect(hslToRgb({ h: offset + 30, s: 100, l: 50 })).toEqual({
      r: 255,
      g: 127.5,
      b: 0,
    });
    expect(oklchToRgb({ l: 0.6, c: 0.1, h: offset + 30, a: 1 })).toEqual(
      oklchToRgb({ l: 0.6, c: 0.1, h: 30, a: 1 }),
    );
  });

  test("negative hue wraps and out-of-gamut OKLCH clips instead of rejecting", () => {
    expect(hslToRgb({ h: -60, s: 100, l: 50 })).toEqual({
      r: 255,
      g: 0,
      b: 255,
    });
    const clipped = oklchToRgb({ l: 0.7, c: 0.8, h: -30, a: 0.25 });
    for (const channel of Object.values(clipped)) {
      expect(Number.isFinite(channel)).toBe(true);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
    expect(
      Object.values(clipped).some(
        (channel) => channel === 0 || channel === 255,
      ),
    ).toBe(true);
  });
});

describe("hex and packed ARGB", () => {
  test.each([
    ["#abc", 0xffaabbcc, "#aabbcc"],
    ["#aBcD", 0xddaabbcc, "#aabbccdd"],
    ["#12ABef", 0xff12abef, "#12abef"],
    ["#12345678", 0x78123456, "#12345678"],
    ["#0000", 0, "#00000000"],
    ["#abcd", 0xddaabbcc, "#aabbccdd"],
    ["#ffffffff", 0xffffffff, "#ffffff"],
    ["#12345600", 0x00123456, "#12345600"],
  ] as const)("parses %s", (input, argb, canonical) => {
    expect(hexToArgb(input)).toBe(argb);
    expect(argbToHex(argb)).toBe(canonical);
  });

  test.each([
    "",
    "abc",
    "red",
    "0xff0000",
    "#",
    "#12",
    "#12345",
    "#1234567",
    "#123456789",
    "#ggg",
    " #abc",
    "#abc ",
    "#abc\n",
    "rgb(0 0 0)",
  ])("rejects invalid hex %j", (input) => {
    expect(() => hexToArgb(input)).toThrow(TypeError);
  });

  test.each([null, undefined, 123, {}, ["#abc"]].map((input) => ({ input })))(
    "rejects non-string hex %j",
    ({ input }) => {
      // @ts-expect-error Exercise untyped callers at the runtime boundary.
      expect(() => hexToArgb(input)).toThrow(TypeError);
    },
  );

  test("signed ARGB is accepted and normalized to unsigned", () => {
    expect(argbToRgba(-1)).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(argbToHex(-0x80000000)).toBe("#00000080");
    expect(convertColorFromArgb(-0x10000, "argb")).toBe(0xffff0000);
    expect(argbToHex(0)).toBe("#00000000");
  });

  test.each([-0x80000001, 0x100000000, 1.5, NaN, Infinity, -Infinity])(
    "all packed converters reject %s",
    (value) => {
      for (const converter of Object.values(ARGB_CONVERTERS)) {
        expect(() => converter(value)).toThrow(RangeError);
      }
    },
  );
});

describe("validation", () => {
  for (const channel of ["r", "g", "b"] as const) {
    test.each([-1, 256, NaN, Infinity, -Infinity])(
      `RGB ${channel} rejects %s`,
      (value) => {
        const color: RGB = { r: 1, g: 2, b: 3, [channel]: value };
        expect(() => rgbToArgb(color)).toThrow(RangeError);
        expect(() => formatColor(color, "rgb")).toThrow(RangeError);
        expect(() => formatColor({ ...color, a: 1 }, "rgba")).toThrow(
          RangeError,
        );
      },
    );
  }
  for (const channel of ["s", "l"] as const) {
    test.each([-1, 101, NaN, Infinity, -Infinity])(
      `HSL ${channel} rejects %s`,
      (value) => {
        const color: HSL = { h: 30, s: 50, l: 50, [channel]: value };
        expect(() => hslToRgb(color)).toThrow(RangeError);
        expect(() => hslToArgb(color)).toThrow(RangeError);
        expect(() => formatColor(color, "hsl")).toThrow(RangeError);
        expect(() => formatColor({ ...color, a: 1 }, "hsla")).toThrow(
          RangeError,
        );
      },
    );
  }
  test.each([NaN, Infinity, -Infinity])("HSL hue must be finite: %s", (h) => {
    expect(() => hslToArgb({ h, s: 0, l: 0 })).toThrow(RangeError);
    expect(() => formatColor({ h, s: 0, l: 0 }, "hsl")).toThrow(RangeError);
  });
  test.each([-0.01, 1.01, NaN, Infinity, -Infinity])(
    "alpha rejects %s",
    (a) => {
      expect(() => rgbToArgb({ r: 0, g: 0, b: 0, a })).toThrow(RangeError);
      expect(() => hslToRgb({ h: 0, s: 0, l: 0, a })).toThrow(RangeError);
      expect(() => hslToArgb({ h: 0, s: 0, l: 0, a })).toThrow(RangeError);
      expect(() => formatColor({ r: 0, g: 0, b: 0, a }, "rgba")).toThrow(
        RangeError,
      );
      expect(() => formatColor({ h: 0, s: 0, l: 0, a }, "hsla")).toThrow(
        RangeError,
      );
    },
  );
  const invalidOklch: OKLCH[] = [
    ...[-0.01, 1.01, NaN, Infinity, -Infinity].map((l) => ({
      l,
      c: 0.1,
      h: 30,
      a: 1,
    })),
    ...[-0.01, NaN, Infinity, -Infinity].map((c) => ({
      l: 0.5,
      c,
      h: 30,
      a: 1,
    })),
    ...[NaN, Infinity, -Infinity].map((h) => ({ l: 0.5, c: 0.1, h, a: 1 })),
    ...[-0.01, 1.01, NaN, Infinity, -Infinity].map((a) => ({
      l: 0.5,
      c: 0.1,
      h: 30,
      a,
    })),
  ];
  test.each(invalidOklch)("rejects invalid OKLCH %j", (color) => {
    expect(() => oklchToRgb(color)).toThrow(RangeError);
    expect(() => oklchToArgb(color)).toThrow(RangeError);
    expect(() => formatColor(color, "oklch")).toThrow(RangeError);
  });
});

describe("deterministic round trips", () => {
  test("boundary grid preserves all bytes through RGBA, HSLA, OKLCH and hex", () => {
    for (const r of [0, 1, 10, 11, 64, 128, 254, 255]) {
      for (const g of [0, 1, 127, 255]) {
        for (const b of [0, 1, 128, 255]) {
          for (const a of [0, 1, 128, 254, 255]) {
            const argb = rgbToArgb({ r, g, b, a: a / 255 });
            expect(rgbToArgb(argbToRgba(argb))).toBe(argb);
            expect(hslToArgb(argbToHsla(argb))).toBe(argb);
            expect(oklchToArgb(argbToOklch(argb))).toBe(argb);
            expect(hexToArgb(argbToHex(argb))).toBe(argb);
            const opaque = (argb | 0xff000000) >>> 0;
            expect(rgbToArgb(argbToRgb(argb))).toBe(opaque);
            expect(hslToArgb(argbToHsl(argb))).toBe(opaque);
          }
        }
      }
    }
  });

  test("fixed-seed generated packed colors round trip without random flakiness", () => {
    let seed = 0x12345678;
    for (let i = 0; i < 512; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      expect(rgbToArgb(argbToRgba(seed))).toBe(seed);
      expect(hslToArgb(argbToHsla(seed))).toBe(seed);
      expect(oklchToArgb(argbToOklch(seed))).toBe(seed);
      expect(hexToArgb(argbToHex(seed))).toBe(seed);
    }
  });
});

describe("CSS formatting and dispatch", () => {
  test("formats every supported representation with explicit CSS units", () => {
    expect(formatColor("#AbCd", "hex")).toBe("#AbCd");
    expect(() => formatColor("#xyz", "hex")).toThrow(TypeError);
    expect(formatColor({ r: 1.5, g: 2, b: 3 }, "rgb")).toBe("rgb(1.5 2 3)");
    expect(formatColor({ r: 1, g: 2, b: 3, a: 0.25 }, "rgba")).toBe(
      "rgba(1 2 3 / 0.25)",
    );
    expect(formatColor({ h: -30, s: 25.5, l: 60 }, "hsl")).toBe(
      "hsl(330 25.5% 60%)",
    );
    expect(formatColor({ h: 390, s: 25, l: 60, a: 0 }, "hsla")).toBe(
      "hsla(30 25% 60% / 0)",
    );
    expect(formatColor({ l: 0.5, c: 0.2, h: 720, a: 1 }, "oklch")).toBe(
      "oklch(0.5 0.2 0 / 1)",
    );
    expect(formatColor(0x00123456, "argb")).toBe("rgba(18 52 86 / 0)");
    expect(formatColor(0xff123456, "argb")).toBe("rgba(18 52 86 / 1)");
    expect(formatColor(0x80123456, "argb")).toBe(
      `rgba(18 52 86 / ${128 / 255})`,
    );
    expect(() => formatColor(1.5, "argb")).toThrow(RangeError);
  });

  test("dispatch matches each dedicated converter", () => {
    const argb = 0x80123456;
    expect(Object.keys(ARGB_CONVERTERS).sort()).toEqual([
      "argb",
      "hex",
      "hsl",
      "hsla",
      "oklch",
      "rgb",
      "rgba",
    ]);
    expect(convertColorFromArgb(argb, "argb")).toBe(argb);
    expect(convertColorFromArgb(argb, "hex")).toBe(argbToHex(argb));
    expect(convertColorFromArgb(argb, "rgb")).toEqual(argbToRgb(argb));
    expect(convertColorFromArgb(argb, "rgba")).toEqual(argbToRgba(argb));
    expect(convertColorFromArgb(argb, "hsl")).toEqual(argbToHsl(argb));
    expect(convertColorFromArgb(argb, "hsla")).toEqual(argbToHsla(argb));
    expect(convertColorFromArgb(argb, "oklch")).toEqual(argbToOklch(argb));
  });
});
