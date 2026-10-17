import {
  Hct,
  SchemeContent,
  SchemeVibrant,
  SchemeRainbow,
  SchemeNeutral,
  SchemeFidelity,
  SchemeTonalSpot,
  SchemeFruitSalad,
  SchemeExpressive,
  SchemeMonochrome,
} from "@material/material-color-utilities";
import type { DynamicScheme } from "@material/material-color-utilities";
import type { ImageSource } from "colorthief";
import { MATERIAL_ROLES, SWATCH_NAMES } from "./data";
import { convertColorFromArgb } from "./convert";
import {
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
} from "./extract";
import type {
  ColorExtractionType,
  ColorFormat,
  MaterialColorResponse,
  MaterialSchemeResult,
  SchemeColors,
  SwatchColorMap,
} from "./types";

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
  /** Material contrast level, from -1 (reduced) to 1 (increased). */
  contrastLevel?: number;
}

export interface ImageSchemeOptions extends SchemeOptions {
  colorType?: ColorExtractionType;
  /**
   * Number of palette colors, from 2 to 10. Defaults to 3.
   * Only applicable when `colorType` is `"palette"`.
   */
  paletteSize?: number;
}

/** Options with a required format, for precise result inference. */
export type SchemeFormatOptions<K extends ColorFormat> = SchemeOptions & {
  format: K;
};

/** Helper function to format a Material scheme as a `SchemeColors` object. */
function formatScheme(
  scheme: DynamicScheme,
  format: ColorFormat,
): SchemeColors<ColorFormat> {
  const dynamicColors = new Map(
    scheme.colors.allColors.map((color) => [color.name, color]),
  );
  return Object.fromEntries(
    MATERIAL_ROLES.map((role) => {
      const color = dynamicColors.get(role);
      if (!color)
        throw new Error(`Material scheme is missing the ${role} role`);
      return [role, convertColorFromArgb(color.getArgb(scheme), format)];
    }),
  ) as SchemeColors<ColorFormat>;
}

/** Create light and dark Material schemes from a 32-bit integer ARGB seed. */
// Default overload
export function schemeFromSourceColor(
  sourceColor: number,
  options?: SchemeOptions & { format?: "hex" },
): MaterialColorResponse<"hex">;

export function schemeFromSourceColor<K extends ColorFormat>(
  sourceColor: number,
  options: SchemeFormatOptions<K>,
): MaterialColorResponse<K>;

export function schemeFromSourceColor(
  sourceColor: number,
  options: SchemeOptions,
): MaterialColorResponse<ColorFormat>;

export function schemeFromSourceColor(
  sourceColor: number,
  options: SchemeOptions = {},
): MaterialColorResponse<ColorFormat> {
  const {
    scheme = "tonalSpot",
    contrastLevel = 0,
    format = "hex"
  } = options;
  
  if (
    !Number.isFinite(contrastLevel) ||
    contrastLevel < -1 ||
    contrastLevel > 1
  ) {
    throw new RangeError("Contrast level must be between -1 and 1");
  }

  const convertedSource = convertColorFromArgb(sourceColor, format);
  const sourceHct = Hct.fromInt(sourceColor);
  const Scheme = SCHEMES[scheme];
  
  return {
    sourceColor: convertedSource,
    color: {
      dark: formatScheme(
        new Scheme(sourceHct, true, contrastLevel),
        format,
      ),
      light: formatScheme(
        new Scheme(sourceHct, false, contrastLevel),
        format,
      ),
    },
  };
}

/** 
 * Create a single-entry array from a dominant color.
 * @param sourceColor The source color in 32bit integer ARGB format.
 * @param options Optional scheme options or name.
 */
export function schemeFromDominantColor(
  sourceColor: number,
  options?: (SchemeOptions & { format?: "hex" }),
): MaterialSchemeResult<"hex">[];

export function schemeFromDominantColor<K extends ColorFormat>(
  sourceColor: number,
  options: SchemeFormatOptions<K>,
): MaterialSchemeResult<K>[];

export function schemeFromDominantColor(
  sourceColor: number,
  options: SchemeOptions ,
): MaterialSchemeResult<ColorFormat>[];

export function schemeFromDominantColor(
  sourceColor: number,
  options: SchemeOptions = {},
): MaterialSchemeResult<ColorFormat>[] {
  const {
    scheme = "tonalSpot",
    contrastLevel = 0,
    format = "hex"
  } = options;
  
  return [
    {
      id: "dominant",
      name: "Dominant",
      ...schemeFromSourceColor(sourceColor, { scheme, contrastLevel, format }),
    },
  ];
}

/** Omit only undefined swatches, preserving SWATCH_NAMES order. */
export function schemeFromSwatchColors(
  swatchColors: SwatchColorMap<"argb">,
  options?: (SchemeOptions & { format?: "hex" }),
): MaterialSchemeResult<"hex">[];

export function schemeFromSwatchColors<K extends ColorFormat>(
  swatchColors: SwatchColorMap<"argb">,
  options: SchemeFormatOptions<K>,
): MaterialSchemeResult<K>[];

export function schemeFromSwatchColors(
  swatchColors: SwatchColorMap<"argb">,
  options: SchemeOptions,
): MaterialSchemeResult<ColorFormat>[];

export function schemeFromSwatchColors(
  swatchColors: SwatchColorMap<"argb">,
  options: SchemeOptions = {},
): MaterialSchemeResult<ColorFormat>[] {
  const {
    scheme = "tonalSpot",
    contrastLevel = 0,
    format = "hex"
  } = options;
  
  const results: MaterialSchemeResult<ColorFormat>[] = [];
  for (const role of SWATCH_NAMES) {
    const sourceColor = swatchColors[role];
    if (sourceColor !== undefined) {
      results.push({
        id: role,
        name: role,
        ...schemeFromSourceColor(sourceColor, { scheme, contrastLevel, format }),
      });
    }
  }
  return results;
}

/** Create ordered palette entries, retaining duplicate and zero-valued seeds. */
export function schemeFromPaletteColors(
  paletteColors: readonly number[],
  options?: (SchemeOptions & { format?: "hex" }),
): MaterialSchemeResult<"hex">[];

export function schemeFromPaletteColors<K extends ColorFormat>(
  paletteColors: readonly number[],
  options: SchemeFormatOptions<K>,
): MaterialSchemeResult<K>[];

export function schemeFromPaletteColors(
  paletteColors: readonly number[],
  options: SchemeOptions,
): MaterialSchemeResult<ColorFormat>[];

export function schemeFromPaletteColors(
  paletteColors: readonly number[],
  options: SchemeOptions = {},
): MaterialSchemeResult<ColorFormat>[] {
  const {
    scheme = "tonalSpot",
    contrastLevel = 0,
    format = "hex"
  } = options;
  
  return paletteColors.map((sourceColor, index) => ({
    id: String(index + 1),
    name: `Palette-${index + 1}`,
    ...schemeFromSourceColor(sourceColor, { scheme, contrastLevel, format }),
  }));
}

/** Every extraction mode returns metadata-bearing entries; empty images return []. */
export function schemeFromImageToColor(
  source: ImageSource,
  options?: ImageSchemeOptions & { format?: "hex" },
): Promise<MaterialSchemeResult<"hex">[]>;
export function schemeFromImageToColor<K extends ColorFormat>(
  source: ImageSource,
  options: ImageSchemeOptions & SchemeFormatOptions<K>,
): Promise<MaterialSchemeResult<K>[]>;
export function schemeFromImageToColor(
  source: ImageSource,
  options: ImageSchemeOptions,
): Promise<MaterialSchemeResult<ColorFormat>[]>;

export async function schemeFromImageToColor(
  source: ImageSource,
  options: ImageSchemeOptions = {},
): Promise<MaterialSchemeResult<ColorFormat>[]> {
  const { colorType = "dominant", paletteSize = 5 } = options;
  switch (colorType) {
    case "dominant": {
      const sourceColor = await getDominantColorFromImage(source, "argb");
      return sourceColor === undefined
        ? []
        : schemeFromDominantColor(sourceColor, options);
    }
    case "palette": {
      const palette = await getPaletteColorFromImage(
        source,
        "argb",
        paletteSize,
      );
      return schemeFromPaletteColors(palette ?? [], options);
    }
    case "swatch": {
      const swatches = await getSwatchColorFromImage(source, "argb");
      return schemeFromSwatchColors(swatches, options);
    }
  }
}
