import { expect, test } from "bun:test";
import {
  convertColorFromArgb,
  convertColorToArgb,
  formatColor,
  rgbToArgb,
  hslToArgb,
  oklchToArgb,
} from "../src/convert";
import {
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
} from "../src/extract";
import {
  schemeFromDominantColor,
  schemeFromImageToColor,
  schemeFromPaletteColors,
  schemeFromSourceColor,
  schemeFromSwatchColors,
  MaterialYouColors,
} from "../index";
import type {
  ImageSchemeOptions,
  SchemeOptions,
  SchemeFormatOptions,
} from "../index";
import type { HSL, HSLA, OKLCH, RGB, RGBA } from "../src/channels";
import type {
  ColorFormat,
  ColorFormatMap,
  ColorResult,
  ImageSchemeResultMap,
  MaterialColorResponse,
  MaterialColorResponseMap,
  MaterialRole,
  MaterialSchemeResult,
  SchemeColors,
  SchemeResponse,
  SwatchColorMap,
  SwatchSchemeMap,
} from "../index";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
function sameType<A, B>(_equal: Equal<A, B>) {}

// TypeScript checks this body, but it must never execute image I/O or deliberate
// type errors. Bun itself does not typecheck; validate with tsc as well.
async function typeContracts() {
  const rgb = convertColorFromArgb(0, "rgb");
  const rgba = convertColorFromArgb(0, "rgba");
  const hsl = convertColorFromArgb(0, "hsl");
  const hsla = convertColorFromArgb(0, "hsla");
  const oklch = convertColorFromArgb(0, "oklch");
  sameType<typeof rgb, RGB>(true);
  sameType<typeof rgba, RGBA>(true);
  sameType<typeof hsl, HSL>(true);
  sameType<typeof hsla, HSLA>(true);
  sameType<typeof oklch, OKLCH>(true);
  sameType<keyof RGB, "r" | "g" | "b">(true);
  sameType<keyof HSL, "h" | "s" | "l">(true);
  sameType<ColorResult<"rgba">, ColorFormatMap["rgba"]>(true);
  sameType<MaterialColorResponseMap["rgb"], MaterialColorResponse<"rgb">>(true);

  sameType<SchemeColors<"hsl">[MaterialRole], HSL>(true);
  // @ts-expect-error RGB deliberately has no alpha channel.
  void rgb.a;
  // @ts-expect-error HSL deliberately has no alpha channel.
  void hsl.a;
  // @ts-expect-error RGBA requires alpha.
  const missingRgba: RGBA = { r: 0, g: 0, b: 0 };
  // @ts-expect-error HSLA requires alpha.
  const missingHsla: HSLA = { h: 0, s: 0, l: 0 };
  // @ts-expect-error OKLCH requires alpha.
  const missingOklch: OKLCH = { l: 0, c: 0, h: 0 };
  void [missingRgba, missingHsla, missingOklch];
  // @ts-expect-error Only supported formats may be dispatched.
  convertColorFromArgb(0, "css");
  // @ts-expect-error An object is not a hex string.
  formatColor(rgb, "hex");
  const integer = convertColorToArgb(rgba, "rgba");
  sameType<typeof integer, number>(true);
  convertColorToArgb("#f00", "hex");
  convertColorToArgb(rgb, "rgb");
  convertColorToArgb(hsl, "hsl");
  convertColorToArgb(hsla, "hsla");
  convertColorToArgb(oklch, "oklch");
  convertColorToArgb(integer, "argb");
  // @ts-expect-error Hex conversion requires a string, not RGB channels.
  convertColorToArgb(rgb, "hex");
  // @ts-expect-error RGBA conversion requires alpha.
  convertColorToArgb(rgb, "rgba");
  // @ts-expect-error Only supported source formats can be converted.
  convertColorToArgb("red", "css");
  rgbToArgb(rgb);
  rgbToArgb(rgba);
  hslToArgb(hsl);
  hslToArgb(hsla);
  oklchToArgb(oklch);

  const defaults = schemeFromSourceColor(0);
  const typed = schemeFromSourceColor(0, { format: "rgba" });
  const palette = schemeFromPaletteColors([0], { format: "hsl" });
  sameType<typeof defaults, MaterialColorResponse<"hex">>(true);
  sameType<typeof typed, MaterialColorResponse<"rgba">>(true);
  sameType<typeof palette, MaterialSchemeResult<"hsl">[]>(true);
  const swatches = await getSwatchColorFromImage("unused", "argb");
  sameType<typeof swatches, SwatchColorMap<"argb">>(true);
  const swatchSchemes = schemeFromSwatchColors(swatches, { format: "oklch" });
  sameType<typeof swatchSchemes, MaterialSchemeResult<"oklch">[]>(true);
  sameType<(typeof swatchSchemes)[number]["color"]["light"]["primary"], OKLCH>(
    true,
  );
  // Retained only as a legacy type, not the helper return shape.
  sameType<
    SwatchSchemeMap<"oklch">["Vibrant"],
    MaterialColorResponse<"oklch"> | undefined
  >(true);
  const dominant = await getDominantColorFromImage("unused", "rgb");
  const extractedPalette = await getPaletteColorFromImage("unused", "rgba");
  sameType<typeof dominant, RGB | undefined>(true);
  sameType<typeof extractedPalette, RGBA[] | undefined>(true);
  const imageDefault = await schemeFromImageToColor("unused");
  const imageDominant = await schemeFromImageToColor("unused", {
    colorType: "dominant",
    format: "rgb",
  });
  const imagePalette = await schemeFromImageToColor("unused", {
    colorType: "palette",
    format: "rgba",
  });
  const imageSwatches = await schemeFromImageToColor("unused", {
    colorType: "swatch",
    format: "oklch",
  });
  sameType<typeof imageDefault, MaterialSchemeResult<"hex">[]>(true);
  sameType<typeof imageDominant, ImageSchemeResultMap<"rgb">["dominant"]>(true);
  sameType<typeof imagePalette, MaterialSchemeResult<"rgba">[]>(true);
  sameType<typeof imageSwatches, MaterialSchemeResult<"oklch">[]>(true);
  sameType<
    ImageSchemeResultMap<"rgba">["palette"],
    MaterialSchemeResult<"rgba">[]
  >(true);
  sameType<
    ImageSchemeResultMap<"oklch">["swatch"],
    MaterialSchemeResult<"oklch">[]
  >(true);

  const dominantSchemes = schemeFromDominantColor(0, { format: "argb" });
  sameType<typeof dominantSchemes, MaterialSchemeResult<"argb">[]>(true);
  const defaultDominant = schemeFromDominantColor(0);
  const defaultPalette = schemeFromPaletteColors([0], { scheme: "vibrant" });
  const defaultSwatch = schemeFromSwatchColors(swatches);
  sameType<typeof defaultDominant, MaterialSchemeResult<"hex">[]>(true);
  sameType<typeof defaultPalette, MaterialSchemeResult<"hex">[]>(true);
  sameType<typeof defaultSwatch, MaterialSchemeResult<"hex">[]>(true);
  const legacyDominant = schemeFromDominantColor(0, "rainbow");
  const legacyPalette = schemeFromPaletteColors([0], "rainbow");
  const legacySwatch = schemeFromSwatchColors(swatches, "rainbow");
  sameType<typeof legacyDominant, MaterialSchemeResult<"hex">[]>(true);
  sameType<typeof legacyPalette, MaterialSchemeResult<"hex">[]>(true);
  sameType<typeof legacySwatch, MaterialSchemeResult<"hex">[]>(true);

  const runtimeOptions: SchemeOptions = { format: "rgba" };
  const runtimeImageOptions: ImageSchemeOptions = {
    ...runtimeOptions,
    colorType: "palette",
  };
  const runtimeSource = schemeFromSourceColor(0, runtimeOptions);
  const runtimeDominant = schemeFromDominantColor(0, runtimeOptions);
  const runtimePalette = schemeFromPaletteColors([0], runtimeOptions);
  const runtimeSwatches = schemeFromSwatchColors(swatches, runtimeOptions);
  const runtimeEntries = await schemeFromImageToColor(
    "unused",
    runtimeImageOptions,
  );
  sameType<typeof runtimeSource, MaterialColorResponse<ColorFormat>>(true);
  sameType<typeof runtimeDominant, MaterialSchemeResult<ColorFormat>[]>(true);
  sameType<typeof runtimePalette, MaterialSchemeResult<ColorFormat>[]>(true);
  sameType<typeof runtimeSwatches, MaterialSchemeResult<ColorFormat>[]>(true);
  sameType<typeof runtimeEntries, MaterialSchemeResult<ColorFormat>[]>(true);
  const uiProps: {
    schemes: readonly MaterialSchemeResult<ColorFormat>[];
    format: ColorFormat;
  } = {
    schemes: runtimeEntries,
    format: runtimeImageOptions.format ?? "hex",
  };
  void uiProps;
  sameType<typeof MaterialYouColors.primary.primary, "Main brand color">(true);

  // Required-format overloads also preserve a caller's generic format.
  function genericFormat<K extends ColorFormat>(format: K) {
    const options: SchemeFormatOptions<K> = { format };
    const source = schemeFromSourceColor(0, options);
    const entries = schemeFromDominantColor(0, options);
    const palette = schemeFromPaletteColors([0], options);
    const swatch = schemeFromSwatchColors(swatches, options);
    const imageEntries = schemeFromImageToColor("unused", {
      ...options,
      colorType: "swatch",
    });
    sameType<typeof source, MaterialColorResponse<K>>(true);
    sameType<typeof entries, MaterialSchemeResult<K>[]>(true);
    sameType<typeof palette, MaterialSchemeResult<K>[]>(true);
    sameType<typeof swatch, MaterialSchemeResult<K>[]>(true);
    sameType<typeof imageEntries, Promise<MaterialSchemeResult<K>[]>>(true);
  }
  void genericFormat;
  const runtimeMode: ImageSchemeOptions["colorType"] =
    runtimeImageOptions.colorType;
  const rgbaWithRuntimeMode = await schemeFromImageToColor("unused", {
    colorType: runtimeMode,
    format: "rgba",
  });
  sameType<typeof rgbaWithRuntimeMode, MaterialSchemeResult<"rgba">[]>(true);
  const unionFormat: "rgb" | "hex" = Math.random() > 0.5 ? "rgb" : "hex";
  const unionSource = schemeFromSourceColor(0, { format: unionFormat });
  sameType<typeof unionSource, MaterialColorResponse<"rgb" | "hex">>(true);
  // @ts-expect-error A generic non-hex result requires an explicit format.
  schemeFromSourceColor<"rgba">(0);
  // @ts-expect-error Format cannot be omitted for a non-hex generic result.
  schemeFromPaletteColors<"rgb">([0], {});
  // @ts-expect-error Image format cannot be omitted for a non-hex generic result.
  schemeFromImageToColor<"oklch">("unused", { colorType: "palette" });
  // @ts-expect-error Invalid scheme names are rejected.
  schemeFromDominantColor(0, "invalid");
  // @ts-expect-error Unsupported formats are rejected.
  schemeFromSourceColor(0, { format: "css" });
}

test("compile-time color contracts are declared but not executed", () => {
  expect(typeof typeContracts).toBe("function");
});
