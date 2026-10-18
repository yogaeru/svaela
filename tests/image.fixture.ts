import { expect } from "bun:test";
import { configure, createColor, getSwatches } from "colorthief";
import type { ExtractionOptions, ImageSource, SwatchMap } from "colorthief";
import { convertColorFromArgb, rgbToArgb } from "../src/convert";
import { SWATCH_NAMES } from "../src/extract";
import {
  getColorFormat,
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
  getSwatchTypeColor,
} from "../src/extract";
import {
  schemeFromDominantColor,
  schemeFromImageToColor,
  schemeFromPaletteColors,
  schemeFromSourceColor,
  schemeFromSwatchColors,
} from "../src/attachment/color";
import type { ColorFormat, SwatchColorMap } from "../src/types";

// Run only in a child process: configure() is global and has no reset API.
// Infer the installed PixelLoader/Quantizer contracts from the public options;
// colorthief does not export those interfaces from its main entry point.
type Loader = NonNullable<ExtractionOptions["loader"]>;
type Quantizer = NonNullable<ExtractionOptions["quantizer"]>;
const formats: ColorFormat[] = [
  "hex",
  "argb",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "oklch",
];
const seed = 0xffcc3366;
const loads: ImageSource[] = [];
const quantizedCounts: number[] = [];

function pixels(
  colors: readonly (readonly [number, number, number, number])[],
): Awaited<ReturnType<Loader["load"]>> {
  const data = new Uint8Array(colors.length * 20 * 4);
  let offset = 0;
  for (const color of colors) {
    for (let i = 0; i < 20; i++) {
      data.set(color, offset);
      offset += 4;
    }
  }
  return {
    data,
    width: colors.length * 20,
    height: colors.length === 0 ? 0 : 1,
  };
}

const fixtures = {
  solid: pixels([[204, 51, 102, 255]]),
  black: pixels([[0, 0, 0, 255]]),
  palette: pixels([
    [204, 51, 102, 255],
    [51, 102, 204, 255],
    [80, 100, 80, 255],
  ]),
  filtered: pixels([
    [255, 255, 255, 255],
    [255, 0, 0, 0],
    [204, 51, 102, 255],
  ]),
  gradient: pixels(
    Array.from(
      { length: 40 },
      (_, i) => [20 + i * 5, 30 + i * 3, 220 - i * 4, 255] as const,
    ),
  ),
  empty: pixels([]),
};
const loader: Loader = {
  async load(source) {
    loads.push(source);
    if (source === "broken") throw new Error("fixture decode failed");
    if (typeof source !== "string" || !Object.hasOwn(fixtures, source))
      throw new Error("unknown fixture");
    return fixtures[source as keyof typeof fixtures];
  },
};
const quantizer: Quantizer = {
  async init() {},
  quantize(samples, maxColors) {
    quantizedCounts.push(maxColors);
    const clusters = new Map<
      string,
      { color: [number, number, number]; population: number }
    >();
    for (const color of samples) {
      const key = color.join(",");
      const cluster = clusters.get(key);
      if (cluster) cluster.population++;
      else clusters.set(key, { color, population: 1 });
    }
    return [...clusters.values()]
      .sort((a, b) => b.population - a.population)
      .slice(0, maxColors);
  },
};
await quantizer.init();
configure({ loader, quantizer });

const cases: Record<string, () => Promise<void>> = {
  async "color adapters"() {
    const color = createColor(204, 51, 102, 20);
    const swatches: SwatchMap = {
      Vibrant: {
        color,
        role: "Vibrant",
        titleTextColor: color,
        bodyTextColor: color,
      },
      Muted: null,
      DarkMuted: null,
      LightMuted: null,
      DarkVibrant: null,
      LightVibrant: null,
    };
    for (const format of formats) {
      expect(getColorFormat(color, format)).toEqual(
        convertColorFromArgb(seed, format),
      );
      expect(getSwatchTypeColor(swatches, format, "Vibrant")).toEqual(
        convertColorFromArgb(seed, format),
      );
      expect(getSwatchTypeColor(swatches, format, "Muted")).toBeUndefined();
    }
  },
  async "dominant and palette formats"() {
    for (const format of formats) {
      expect(await getDominantColorFromImage("solid", format)).toEqual(
        convertColorFromArgb(seed, format),
      );
      expect(await getPaletteColorFromImage("solid", format)).toEqual([
        convertColorFromArgb(seed, format),
      ]);
      expect(await getPaletteColorFromImage("palette", format)).toEqual(
        [seed, 0xff3366cc, 0xff506450].map((color) =>
          convertColorFromArgb(color, format),
        ),
      );
    }
    expect(
      loads.every((source) => ["solid", "palette"].includes(String(source))),
    ).toBe(true);
  },
  async "sampling filters"() {
    expect(await getDominantColorFromImage("filtered", "argb")).toBe(seed);
    expect(await getPaletteColorFromImage("filtered", "rgba")).toEqual([
      { r: 204, g: 51, b: 102, a: 1 },
    ]);
  },
  async "swatch formats and missing roles"() {
    const raw = await getSwatches("solid");
    expect(Object.values(raw).some((swatch) => swatch !== null)).toBe(true);
    expect(Object.values(raw).some((swatch) => swatch === null)).toBe(true);
    for (const format of formats) {
      const result = await getSwatchColorFromImage("solid", format);
      expect(Object.keys(result).sort()).toEqual([...SWATCH_NAMES].sort());
      for (const role of SWATCH_NAMES) {
        expect(Object.hasOwn(result, role)).toBe(true);
        const swatch = raw[role];
        expect(result[role]).toEqual(
          swatch
            ? convertColorFromArgb(rgbToArgb(swatch.color.rgb()), format)
            : undefined,
        );
      }
    }
  },
  async "palette count forwarding"() {
    for (const count of [2, 3, 20]) {
      const result = await getPaletteColorFromImage("gradient", "argb", count);
      expect(result).toHaveLength(count);
      expect(quantizedCounts.at(-1)).toBe(count);
    }
    expect(await getPaletteColorFromImage("gradient", "hex")).toHaveLength(3);
    expect(quantizedCounts.at(-1)).toBe(3);
    await getDominantColorFromImage("gradient", "hex");
    expect(quantizedCounts.at(-1)).toBe(5);
    await getSwatchColorFromImage("gradient", "hex");
    expect(quantizedCounts.at(-1)).toBe(16);
  },
  async "palette count validation"() {
    for (const count of [0, 1, 21, -1, 2.5, NaN, Infinity, -Infinity]) {
      await expect(
        getPaletteColorFromImage("gradient", "hex", count),
      ).rejects.toThrow(RangeError);
      await expect(
        schemeFromImageToColor("gradient", {
          colorType: "palette",
          paletteSize: count,
        }),
      ).rejects.toThrow(RangeError);
    }
    expect(loads).toEqual([]);
  },
  async "dominant image schemes and options"() {
    for (const format of formats) {
      const options = {
        format,
        scheme: "expressive" as const,
        contrastLevel: 0.75,
      };
      const expected = schemeFromSourceColor(seed, options);
      const entries = [{ id: "dominant", name: "Dominant", ...expected }];
      expect(await schemeFromImageToColor("solid", options)).toEqual(entries);
      expect(
        await schemeFromImageToColor("solid", {
          ...options,
          colorType: "dominant",
        }),
      ).toEqual(entries);
    }
    expect(await schemeFromImageToColor("solid")).toEqual(
      schemeFromDominantColor(seed),
    );
    expect(await schemeFromImageToColor("black", { format: "argb" })).toEqual(
      schemeFromDominantColor(0xff000000, { format: "argb" }),
    );
  },
  async "palette image schemes are flat and options propagate"() {
    for (const format of formats) {
      const options = {
        format,
        scheme: "rainbow" as const,
        contrastLevel: -0.75,
      };
      const result = await schemeFromImageToColor("palette", {
        ...options,
        colorType: "palette",
      });
      expect(result).toEqual(
        schemeFromPaletteColors([seed, 0xff3366cc, 0xff506450], options),
      );
      expect(result).toHaveLength(3);
      for (const [index, entry] of result.entries()) {
        expect(Array.isArray(entry)).toBe(false);
        expect(Object.keys(entry).sort()).toEqual([
          "colors",
          "id",
          "name",
          "sourceColor",
        ]);
        expect(entry.id).toBe(String(index + 1));
        expect(entry.name).toBe(`Palette-${index + 1}`);
      }
    }
    expect(
      await schemeFromImageToColor("gradient", {
        colorType: "palette",
        paletteSize: 2,
      }),
    ).toHaveLength(2);
    expect(quantizedCounts.at(-1)).toBe(2);
    expect(
      await schemeFromImageToColor("gradient", { colorType: "palette" }),
    ).toHaveLength(3);
    expect(quantizedCounts.at(-1)).toBe(3);
  },
  async "swatch image schemes omit missing roles"() {
    const swatches = await getSwatchColorFromImage("solid", "argb");
    for (const format of formats) {
      const options = {
        format,
        scheme: "fidelity" as const,
        contrastLevel: 0.5,
      };
      const result = await schemeFromImageToColor("solid", {
        ...options,
        colorType: "swatch",
      });
      expect(result).toEqual(schemeFromSwatchColors(swatches, options));
      const roles = SWATCH_NAMES.filter((role) => swatches[role] !== undefined);
      expect(result.map(({ id }) => id)).toEqual(roles);
      expect(result.map(({ name }) => name)).toEqual(roles);
    }
  },
  async "no colors"() {
    expect(await schemeFromImageToColor("empty")).toEqual([]);
    for (const colorType of ["dominant", "palette", "swatch"] as const) {
      expect(await schemeFromImageToColor("empty", { colorType })).toEqual([]);
    }
    for (const format of formats) {
      expect(await getDominantColorFromImage("empty", format)).toBeUndefined();
      expect(await getPaletteColorFromImage("empty", format)).toBeUndefined();
      const swatches: SwatchColorMap<typeof format> =
        await getSwatchColorFromImage("empty", format);
      expect(Object.keys(swatches).sort()).toEqual([...SWATCH_NAMES].sort());
      expect(Object.values(swatches)).toEqual(
        SWATCH_NAMES.map(() => undefined),
      );
      expect(await schemeFromImageToColor("empty", { format })).toEqual([]);
      expect(
        await schemeFromImageToColor("empty", { format, colorType: "palette" }),
      ).toEqual([]);
      expect(
        await schemeFromImageToColor("empty", { format, colorType: "swatch" }),
      ).toEqual([]);
    }
  },
  async "errors propagate"() {
    await expect(getDominantColorFromImage("broken", "hex")).rejects.toThrow(
      "fixture decode failed",
    );
    await expect(getPaletteColorFromImage("broken", "hex")).rejects.toThrow(
      "fixture decode failed",
    );
    await expect(getSwatchColorFromImage("broken", "hex")).rejects.toThrow(
      "fixture decode failed",
    );
    for (const colorType of ["dominant", "palette", "swatch"] as const) {
      await expect(
        schemeFromImageToColor("broken", { colorType }),
      ).rejects.toThrow("fixture decode failed");
      await expect(
        schemeFromImageToColor("solid", { colorType, contrastLevel: 2 }),
      ).rejects.toThrow(RangeError);
    }
  },
};

const name = Bun.argv[2];
if (!Object.hasOwn(cases, name))
  throw new Error(`Unknown image fixture case: ${name}`);
await cases[name]();
