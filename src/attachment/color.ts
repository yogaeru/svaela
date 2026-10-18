import {
  Hct,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
} from "@material/material-color-utilities";
import type { DynamicScheme } from "@material/material-color-utilities";
import type { ImageSource } from "colorthief";

import { convertColorFromArgb } from "../convert.js";
import {
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
  SWATCH_NAMES,
} from "../extract.js";
import type {
  ColorExtractionType,
  ColorFormat,
  MaterialColorResponse,
  MaterialRole,
  MaterialSchemeResult,
  SchemeColors,
  SwatchColorMap,
} from "../types.js";

export const MATERIAL_ROLES = [
  "background",
  "on_background",
  "surface",
  "surface_dim",
  "surface_bright",
  "surface_container_lowest",
  "surface_container_low",
  "surface_container",
  "surface_container_high",
  "surface_container_highest",
  "on_surface",
  "on_surface_variant",
  "outline",
  "outline_variant",
  "inverse_surface",
  "inverse_on_surface",
  "primary",
  "primary_dim",
  "on_primary",
  "primary_container",
  "on_primary_container",
  "primary_fixed",
  "primary_fixed_dim",
  "on_primary_fixed",
  "on_primary_fixed_variant",
  "inverse_primary",
  "secondary",
  "secondary_dim",
  "on_secondary",
  "secondary_container",
  "on_secondary_container",
  "secondary_fixed",
  "secondary_fixed_dim",
  "on_secondary_fixed",
  "on_secondary_fixed_variant",
  "tertiary",
  "tertiary_dim",
  "on_tertiary",
  "tertiary_container",
  "on_tertiary_container",
  "tertiary_fixed",
  "tertiary_fixed_dim",
  "on_tertiary_fixed",
  "on_tertiary_fixed_variant",
  "error",
  "error_dim",
  "on_error",
  "error_container",
  "on_error_container",
] as const satisfies readonly MaterialRole[];

export const SCHEMES = {
  content: SchemeContent,
  vibrant: SchemeVibrant,
  rainbow: SchemeRainbow,
  neutral: SchemeNeutral,
  fidelity: SchemeFidelity,
  tonalSpot: SchemeTonalSpot,
  fruitSalad: SchemeFruitSalad,
  expressive: SchemeExpressive,
  monochrome: SchemeMonochrome,
} as const;

export type SchemeName = keyof typeof SCHEMES;

export interface SchemeOptions {
  format?: ColorFormat;
  scheme?: SchemeName;
  contrastLevel?: number;
}

export interface SchemeFormatOptions<
  F extends ColorFormat,
> extends SchemeOptions {
  format: F;
}

export interface ImageSchemeOptions extends SchemeOptions {
  colorType?: ColorExtractionType;
  paletteSize?: number;
}

type SchemeInput = SchemeOptions | SchemeName;

function resolveOptions(options: SchemeInput | undefined): SchemeOptions {
  return typeof options === "string" ? { scheme: options } : options ?? {};
}

function formatScheme(scheme: DynamicScheme, format: ColorFormat) {
  const values = new Map(
    scheme.colors.allColors.map((color) => [color.name, color]),
  );
  const result = {} as SchemeColors<ColorFormat>;
  for (const role of MATERIAL_ROLES) {
    const color = values.get(role);
    if (!color) throw new Error(`Material scheme is missing the ${role} role`);
    result[role] = {
      light: convertColorFromArgb(color.getArgb(scheme), format),
      dark: convertColorFromArgb(color.getArgb(scheme), format),
    };
  }
  return result;
}

function createColors(
  sourceColor: number,
  options: SchemeOptions,
): SchemeColors<ColorFormat> {
  const format = options.format ?? "hex";
  const contrast = options.contrastLevel ?? 0;
  if (!Number.isFinite(contrast) || contrast < -1 || contrast > 1) {
    throw new RangeError("Contrast level must be between -1 and 1");
  }
  const source = Hct.fromInt(sourceColor);
  const Scheme = SCHEMES[options.scheme ?? "tonalSpot"];
  const light = new Scheme(source, false, contrast);
  const dark = new Scheme(source, true, contrast);
  const lightColors = formatScheme(light, format);
  const darkColors = formatScheme(dark, format);
  for (const role of MATERIAL_ROLES) {
    lightColors[role].dark = darkColors[role].dark;
  }
  return lightColors;
}

export function schemeFromSourceColor(
  sourceColor: number,
  options?: SchemeOptions & { format?: "hex" },
): MaterialColorResponse<"hex">;
export function schemeFromSourceColor<F extends ColorFormat>(
  sourceColor: number,
  options: SchemeFormatOptions<F>,
): MaterialColorResponse<F>;
export function schemeFromSourceColor(
  sourceColor: number,
  options: SchemeOptions,
): MaterialColorResponse<ColorFormat>;
export function schemeFromSourceColor(
  sourceColor: number,
  options: SchemeOptions = {},
): MaterialColorResponse<ColorFormat> {
  return {
    sourceColor: convertColorFromArgb(sourceColor, options.format ?? "hex"),
    colors: createColors(sourceColor, options),
  };
}

export function schemeFromDominantColor(
  sourceColor: number,
  options?: SchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];
export function schemeFromDominantColor<F extends ColorFormat>(
  sourceColor: number,
  options: SchemeFormatOptions<F>,
): MaterialSchemeResult<F>[];
export function schemeFromDominantColor(
  sourceColor: number,
  scheme: SchemeName,
): MaterialSchemeResult<"hex">[];
export function schemeFromDominantColor(
  sourceColor: number,
  options: SchemeInput,
): MaterialSchemeResult<ColorFormat>[];
export function schemeFromDominantColor(
  sourceColor: number,
  options: SchemeInput = {},
): MaterialSchemeResult<ColorFormat>[] {
  options = resolveOptions(options);
  return [
    {
      id: "dominant",
      name: "Dominant",
      ...schemeFromSourceColor(sourceColor, options),
    },
  ];
}

export function schemeFromPaletteColors(
  colors: readonly number[],
  options?: SchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];
export function schemeFromPaletteColors<F extends ColorFormat>(
  colors: readonly number[],
  options: SchemeFormatOptions<F>,
): MaterialSchemeResult<F>[];
export function schemeFromPaletteColors(
  colors: readonly number[],
  scheme: SchemeName,
): MaterialSchemeResult<"hex">[];
export function schemeFromPaletteColors(
  colors: readonly number[],
  options: SchemeInput,
): MaterialSchemeResult<ColorFormat>[];
export function schemeFromPaletteColors(
  colors: readonly number[],
  options: SchemeInput = {},
): MaterialSchemeResult<ColorFormat>[] {
  options = resolveOptions(options);
  return colors.map((sourceColor, index) => ({
    id: String(index + 1),
    name: `Palette-${index + 1}`,
    ...schemeFromSourceColor(sourceColor, options),
  }));
}

export function schemeFromSwatchColors(
  swatches: SwatchColorMap<"argb">,
  options?: SchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];
export function schemeFromSwatchColors<F extends ColorFormat>(
  swatches: SwatchColorMap<"argb">,
  options: SchemeFormatOptions<F>,
): MaterialSchemeResult<F>[];
export function schemeFromSwatchColors(
  swatches: SwatchColorMap<"argb">,
  scheme: SchemeName,
): MaterialSchemeResult<"hex">[];
export function schemeFromSwatchColors(
  swatches: SwatchColorMap<"argb">,
  options: SchemeInput,
): MaterialSchemeResult<ColorFormat>[];
export function schemeFromSwatchColors(
  swatches: SwatchColorMap<"argb">,
  options: SchemeInput = {},
): MaterialSchemeResult<ColorFormat>[] {
  options = resolveOptions(options);
  return SWATCH_NAMES.flatMap((name) => {
    const sourceColor = swatches[name];
    return sourceColor === undefined
      ? []
      : [{ id: name, name, ...schemeFromSourceColor(sourceColor, options) }];
  });
}

export function schemeFromImageToColor(
  source: ImageSource,
  options?: ImageSchemeOptions & { format?: "hex" },
): Promise<MaterialSchemeResult<"hex">[]>;
export function schemeFromImageToColor<F extends ColorFormat>(
  source: ImageSource,
  options: ImageSchemeOptions & SchemeFormatOptions<F>,
): Promise<MaterialSchemeResult<F>[]>;
export function schemeFromImageToColor(
  source: ImageSource,
  options: ImageSchemeOptions,
): Promise<MaterialSchemeResult<ColorFormat>[]>;
export async function schemeFromImageToColor(
  source: ImageSource,
  options: ImageSchemeOptions = {},
): Promise<MaterialSchemeResult<ColorFormat>[]> {
  switch (options.colorType ?? "dominant") {
    case "dominant": {
      const color = await getDominantColorFromImage(source, "argb");
      return color === undefined ? [] : schemeFromDominantColor(color, options);
    }
    case "palette": {
      const colors = await getPaletteColorFromImage(
        source,
        "argb",
        options.paletteSize,
      );
      return schemeFromPaletteColors(colors ?? [], options);
    }
    case "swatch":
      return schemeFromSwatchColors(
        await getSwatchColorFromImage(source, "argb"),
        options,
      );
  }
}
