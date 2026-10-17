import { describe, expect, spyOn, test } from "bun:test";
import { Hct } from "@material/material-color-utilities";
import { convertColorFromArgb, argbToRgb } from "../src/convert";
import { MATERIAL_ROLES, SWATCH_NAMES } from "../src/data";
import {
  SCHEMES,
  schemeFromDominantColor,
  schemeFromPaletteColors,
  schemeFromSourceColor,
  schemeFromSwatchColors,
} from "../src/material";
import type { SchemeName } from "../src/material";
import type { ColorFormat, SwatchColorMap } from "../src/types";

const formats: ColorFormat[] = [
  "hex",
  "argb",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "oklch",
];
const schemes = Object.keys(SCHEMES) as SchemeName[];
const seed = 0xff6750a4;
const emptySwatches = (): SwatchColorMap<"argb"> => ({
  Vibrant: undefined,
  DarkVibrant: undefined,
  LightVibrant: undefined,
  Muted: undefined,
  DarkMuted: undefined,
  LightMuted: undefined,
});

function contrast(first: number, second: number): number {
  const luminance = (argb: number) => {
    const { r, g, b } = argbToRgb(argb);
    const linear = (channel: number) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("Material source schemes", () => {
  test("all nine public scheme names are covered", () => {
    expect(schemes.sort()).toEqual([
      "content",
      "expressive",
      "fidelity",
      "fruitSalad",
      "monochrome",
      "neutral",
      "rainbow",
      "tonalSpot",
      "vibrant",
    ]);
    expect(new Set(MATERIAL_ROLES).size).toBe(MATERIAL_ROLES.length);
  });

  for (const scheme of schemes) {
    test.each(formats)(
      `${scheme} supplies every light/dark role as %s`,
      (format) => {
        const result = schemeFromSourceColor(seed, { scheme, format });
        const packed = schemeFromSourceColor(seed, { scheme, format: "argb" });
        expect(Object.keys(result).sort()).toEqual(["color", "sourceColor"]);
        expect(Object.keys(result.color).sort()).toEqual(["dark", "light"]);
        expect(result.sourceColor).toEqual(convertColorFromArgb(seed, format));
        for (const mode of ["light", "dark"] as const) {
          expect(Object.keys(result.color[mode]).sort()).toEqual(
            [...MATERIAL_ROLES].sort(),
          );
          for (const role of MATERIAL_ROLES) {
            expect(result.color[mode][role]).toEqual(
              convertColorFromArgb(packed.color[mode][role], format),
            );
            expect(Number.isInteger(packed.color[mode][role])).toBe(true);
            expect(packed.color[mode][role] >>> 24).toBe(255);
          }
        }
        expect(packed.color.light.background).not.toBe(
          packed.color.dark.background,
        );
      },
    );
  }

  test("defaults are hex / tonalSpot / standard contrast and repeat deterministically", () => {
    const defaults = schemeFromSourceColor(seed);
    expect(defaults).toEqual(
      schemeFromSourceColor(seed, {
        format: "hex",
        scheme: "tonalSpot",
        contrastLevel: 0,
      }),
    );
    expect(defaults).toEqual(schemeFromSourceColor(seed));
    expect(defaults.sourceColor).toBe("#6750a4");
  });

  test.each(schemes)(
    "%s passes contrast through to both Material constructors",
    (scheme) => {
      for (const contrastLevel of [-1, 0, 1]) {
        const result = schemeFromSourceColor(seed, {
          scheme,
          format: "argb",
          contrastLevel,
        });
        for (const mode of ["light", "dark"] as const) {
          const material = new SCHEMES[scheme](
            Hct.fromInt(seed),
            mode === "dark",
            contrastLevel,
          );
          const colors = new Map(
            material.colors.allColors.map((color) => [color.name, color]),
          );
          for (const role of MATERIAL_ROLES) {
            expect(result.color[mode][role]).toBe(
              colors.get(role)!.getArgb(material),
            );
          }
        }
      }
    },
  );

  test("increased contrast changes roles and increases primary text contrast", () => {
    const reduced = schemeFromSourceColor(seed, {
      format: "argb",
      contrastLevel: -1,
    });
    const increased = schemeFromSourceColor(seed, {
      format: "argb",
      contrastLevel: 1,
    });
    for (const mode of ["light", "dark"] as const) {
      expect(increased.color[mode]).not.toEqual(reduced.color[mode]);
      expect(
        contrast(
          increased.color[mode].primary,
          increased.color[mode].on_primary,
        ),
      ).toBeGreaterThan(
        contrast(reduced.color[mode].primary, reduced.color[mode].on_primary),
      );
    }
  });

  test.each([-1.01, 1.01, NaN, Infinity, -Infinity])(
    "rejects contrast %s",
    (contrastLevel) => {
      expect(() => schemeFromSourceColor(seed, { contrastLevel })).toThrow(
        RangeError,
      );
    },
  );
  test.each([-0x80000001, 0x100000000, 0.5, NaN, Infinity])(
    "rejects invalid seed %s",
    (value) => {
      expect(() => schemeFromSourceColor(value)).toThrow(RangeError);
    },
  );

  test("zero, signed seeds and transparent source alpha are valid", () => {
    expect(schemeFromSourceColor(0, { format: "argb" }).sourceColor).toBe(0);
    expect(schemeFromSourceColor(-1)).toEqual(
      schemeFromSourceColor(0xffffffff),
    );
    expect(schemeFromSourceColor(0x806750a4).sourceColor).toBe("#6750a480");
    expect(schemeFromSourceColor(0x806750a4).color).toEqual(
      schemeFromSourceColor(seed).color,
    );
  });
});

describe("dominant, palette and swatch schemes", () => {
  test.each(formats)(
    "dominant returns one metadata-bearing entry in %s",
    (format) => {
      const options = {
        format,
        scheme: "content" as const,
        contrastLevel: 0.5,
      };
      expect(schemeFromDominantColor(0, options)).toEqual([
        {
          id: "dominant",
          name: "Dominant",
          ...schemeFromSourceColor(0, options),
        },
      ]);
    },
  );
  test.each(formats)(
    "palette returns a flat ordered MaterialSchemeResult[] in %s",
    (format) => {
      const palette = Object.freeze([0, seed, 0xff123456, seed]);
      const options = {
        format,
        scheme: "expressive" as const,
        contrastLevel: 0.75,
      };
      const result = schemeFromPaletteColors(palette, options);
      expect(result).toHaveLength(palette.length);
      for (const [index, color] of result.entries()) {
        expect(Array.isArray(color)).toBe(false);
        expect(Object.keys(color).sort()).toEqual([
          "color",
          "id",
          "name",
          "sourceColor",
        ]);
        expect(color).toEqual({
          id: String(index + 1),
          name: `Palette-${index + 1}`,
          ...schemeFromSourceColor(palette[index], options),
        });
      }
      expect(palette).toEqual([0, seed, 0xff123456, seed]);
      expect(schemeFromPaletteColors([], options)).toEqual([]);
    },
  );

  test("legacy scheme-name shorthand is equivalent to options", () => {
    expect(schemeFromDominantColor(seed, "neutral")).toEqual(
      schemeFromDominantColor(seed, { scheme: "neutral" }),
    );
    expect(schemeFromPaletteColors([seed], "rainbow")).toEqual(
      schemeFromPaletteColors([seed], { scheme: "rainbow" }),
    );
    const swatches = { ...emptySwatches(), Vibrant: seed };
    expect(schemeFromSwatchColors(swatches, "fidelity")).toEqual(
      schemeFromSwatchColors(swatches, { scheme: "fidelity" }),
    );
  });

  test.each(formats)(
    "swatches omit missing roles but accept seed zero in %s",
    (format) => {
      const swatches = Object.freeze({
        ...emptySwatches(),
        Vibrant: seed,
        DarkMuted: 0,
      });
      const options = {
        format,
        scheme: "vibrant" as const,
        contrastLevel: -0.5,
      };
      const result = schemeFromSwatchColors(swatches, options);
      expect(result).toEqual([
        {
          id: "Vibrant",
          name: "Vibrant",
          ...schemeFromSourceColor(seed, options),
        },
        {
          id: "DarkMuted",
          name: "DarkMuted",
          ...schemeFromSourceColor(0, options),
        },
      ]);
      expect(schemeFromSwatchColors(emptySwatches(), options)).toEqual([]);
      expect(swatches.DarkMuted).toBe(0);
    },
  );

  test("each available swatch generates only one light/dark pair", () => {
    const fromInt = spyOn(Hct, "fromInt");
    try {
      const swatches = { ...emptySwatches(), Vibrant: seed, DarkMuted: 0 };
      const result = schemeFromSwatchColors(swatches);
      // Each constructor also uses Hct internally, so compare against the source factory.
      const calls = fromInt.mock.calls.length;
      fromInt.mockClear();
      schemeFromSourceColor(seed);
      schemeFromSourceColor(0);
      expect(calls).toBe(fromInt.mock.calls.length);
      expect(result).toHaveLength(2);
    } finally {
      fromInt.mockRestore();
    }
  });

  test("all six swatch roles are retained in SWATCH_NAMES order, not insertion order", () => {
    const swatches = Object.fromEntries(
      [...SWATCH_NAMES].reverse().map((role, index) => [role, seed + index]),
    ) as SwatchColorMap<"argb">;
    const result = schemeFromSwatchColors(swatches, { format: "argb" });
    expect(result.map(({ id }) => id)).toEqual([...SWATCH_NAMES]);
    expect(result.map(({ name }) => name)).toEqual([...SWATCH_NAMES]);
    for (const [index, role] of SWATCH_NAMES.entries())
      expect(swatches[role]).toBe(result[index].sourceColor);
  });
});
