/**
 * Material 3 schemes from packed ARGB seeds or image-extracted colors.
 * Results are role-first: `colors.primary.light` and `colors.primary.dark`.
 * Seeds accept signed/unsigned 32-bit 0xAARRGGBB; generated roles are opaque,
 * regardless of seed alpha. Defaults are hex, tonalSpot, and contrast level 0.
 * @module
 */

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

import { convertColorFromArgb } from "./convert";
import {
  extractDominantColor,
  extractPaletteColors,
  extractSwatchColors,
  SWATCH_ROLES,
} from "./extract.js";
import type {
  ColorExtractionMode,
  ColorFormat,
  MaterialScheme,
  MaterialRole,
  MaterialSchemeResult,
  MaterialSchemeColors,
  SwatchColorMap,
} from "./types.js";

/** Complete role list and insertion order used in each generated color map. */
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

/** Available Material scheme constructors; `tonalSpot` is the default variant. */
export const MATERIAL_SCHEMES = {
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

/** Case-sensitive variant key accepted by scheme options and shorthand calls. */
export type MaterialSchemeVariant = keyof typeof MATERIAL_SCHEMES;

/** Shared generation options; omitting options is equivalent to `{}`. */
export interface MaterialSchemeOptions {
  /** Output format for both sourceColor and roles. @default "hex" */
  format?: ColorFormat;
  /** Material algorithm used for both light and dark modes. @default "tonalSpot" */
  scheme?: MaterialSchemeVariant;
  /** Finite contrast in -1..1; 0 is standard. Invalid values throw RangeError when generating a seed. @default 0 */
  contrastLevel?: number;
}

/** Explicit format selection that preserves the matching return value type. */
export interface MaterialSchemeFormatOptions<
  Format extends ColorFormat,
> extends MaterialSchemeOptions {
  /** Required output format, inferred as Format by the typed overloads. */
  format: Format;
}

/** Image seed selection plus the shared scheme options. */
export interface MaterialSchemeImageOptions extends MaterialSchemeOptions {
  /** Extraction strategy; only that strategy is run. @default "dominant" */
  extractionMode?: ColorExtractionMode;
  /** @deprecated Use extractionMode. Ignored when extractionMode is supplied. */
  colorType?: ColorExtractionMode;
  /** Requested palette size, integer 2..20; validated only in palette mode. @default 3 */
  paletteSize?: number;
}

type MaterialSchemeInput = MaterialSchemeOptions | MaterialSchemeVariant;

function resolveMaterialSchemeOptions(
  options: MaterialSchemeInput | undefined,
): MaterialSchemeOptions {
  return typeof options === "string" ? { scheme: options } : (options ?? {});
}

function formatMaterialScheme(scheme: DynamicScheme, format: ColorFormat) {
  const roleColorsByName = new Map(
    scheme.colors.allColors.map((roleColor) => [roleColor.name, roleColor]),
  );
  const schemeColors = {} as MaterialSchemeColors<ColorFormat>;
  for (const role of MATERIAL_ROLES) {
    const roleColor = roleColorsByName.get(role);
    if (!roleColor)
      throw new Error(`Material scheme is missing the ${role} role`);
    schemeColors[role] = {
      light: convertColorFromArgb(roleColor.getArgb(scheme), format),
      dark: convertColorFromArgb(roleColor.getArgb(scheme), format),
    };
  }
  return schemeColors;
}

function createMaterialSchemeColors(
  sourceArgb: number,
  options: MaterialSchemeOptions,
): MaterialSchemeColors<ColorFormat> {
  const format = options.format ?? "hex";
  const contrastLevel = options.contrastLevel ?? 0;
  if (
    !Number.isFinite(contrastLevel) ||
    contrastLevel < -1 ||
    contrastLevel > 1
  ) {
    throw new RangeError("Contrast level must be between -1 and 1");
  }
  const sourceHct = Hct.fromInt(sourceArgb);
  const SchemeConstructor = MATERIAL_SCHEMES[options.scheme ?? "tonalSpot"];
  const lightScheme = new SchemeConstructor(sourceHct, false, contrastLevel);
  const darkScheme = new SchemeConstructor(sourceHct, true, contrastLevel);
  const lightColors = formatMaterialScheme(lightScheme, format);
  const darkColors = formatMaterialScheme(darkScheme, format);
  for (const role of MATERIAL_ROLES) {
    lightColors[role].dark = darkColors[role].dark;
  }
  return lightColors;
}

/**
 * Generate all Material roles in light and dark modes from one ARGB seed.
 *
 * @param sourceArgb - Signed/unsigned 32-bit integer 0xAARRGGBB.
 * @param options - Defaults: format `"hex"`, scheme `"tonalSpot"`, contrastLevel 0.
 * @returns `{ sourceColor, colors }`, with roles in `MATERIAL_ROLES` order.
 * Source alpha survives in hex/argb/rgba/hsla/oklch; role colors are opaque.
 * @throws {RangeError} For an invalid ARGB integer or nonfinite/out-of-range contrast.
 * @throws {Error} If the upstream Material scheme is missing a required role.
 * @example
 * const theme = createMaterialScheme(0xff6750a4);
 * theme.colors.primary.light; // hex string
 */
export function createMaterialScheme(
  sourceArgb: number,
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialScheme<"hex">;
/** Generate a scheme in explicit format Format; see the default overload for validation and alpha semantics. */
export function createMaterialScheme<Format extends ColorFormat>(
  sourceArgb: number,
  options: MaterialSchemeFormatOptions<Format>,
): MaterialScheme<Format>;
/** Generate a scheme with runtime-selected options; color values use the format union. */
export function createMaterialScheme(
  sourceArgb: number,
  options: MaterialSchemeOptions,
): MaterialScheme<ColorFormat>;
export function createMaterialScheme(
  sourceArgb: number,
  options: MaterialSchemeOptions = {},
): MaterialScheme<ColorFormat> {
  return {
    sourceColor: convertColorFromArgb(sourceArgb, options.format ?? "hex"),
    colors: createMaterialSchemeColors(sourceArgb, options),
  };
}

/**
 * Wrap a seed's scheme in dominant-color metadata; this does not extract an image.
 * @param sourceArgb - Signed/unsigned 32-bit 0xAARRGGBB seed.
 * @param options - Scheme options (hex/tonalSpot/0 by default), or a variant name.
 * @returns One result with `id: "dominant"`, `name: "Dominant"`, sourceColor,
 * and role-first light/dark colors; never an empty array for a valid seed.
 * @throws {RangeError} For invalid ARGB or contrast; see {@link createMaterialScheme}.
 * @throws {Error} If an upstream required role is missing.
 */
export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];
/** Return one dominant result in format Format; seed alpha follows {@link createMaterialScheme}. */
export function createMaterialSchemesFromDominantColor<
  Format extends ColorFormat,
>(
  sourceArgb: number,
  options: MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];
/** Variant-name shorthand; returns one dominant result in hex at standard contrast. */
export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  scheme: MaterialSchemeVariant,
): MaterialSchemeResult<"hex">[];
/** Return one dominant result with runtime-selected options or a variant shorthand. */
export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  options: MaterialSchemeInput,
): MaterialSchemeResult<ColorFormat>[];
export function createMaterialSchemesFromDominantColor(
  sourceArgb: number,
  options: MaterialSchemeInput = {},
): MaterialSchemeResult<ColorFormat>[] {
  options = resolveMaterialSchemeOptions(options);
  return [
    {
      id: "dominant",
      name: "Dominant",
      ...createMaterialScheme(sourceArgb, options),
    },
  ];
}

/**
 * Generate one scheme per palette seed, preserving input order and duplicates.
 * @param paletteArgb - Readonly array of signed/unsigned 32-bit 0xAARRGGBB seeds.
 * @param options - Scheme options (hex/tonalSpot/0 by default), or a variant name.
 * @returns Results with 1-based string ids (`"1"`, ...) and names (`"Palette-1"`, ...),
 * sourceColor, and role-first light/dark colors. Empty input returns `[]` without
 * validating scheme options. No palette-size limit applies to this helper.
 * @throws {RangeError} For invalid ARGB or contrast on a nonempty input.
 * @throws {Error} If an upstream required role is missing.
 * @example
 * const themes = createMaterialSchemesFromPalette([0xff6750a4], { format: "rgb" });
 * themes[0]?.colors.primary.dark.r;
 */
export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];
/** Return palette schemes in format Format and input order; alpha follows {@link createMaterialScheme}. */
export function createMaterialSchemesFromPalette<Format extends ColorFormat>(
  paletteArgb: readonly number[],
  options: MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];
/** Variant-name shorthand; return palette schemes in hex at standard contrast. */
export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  scheme: MaterialSchemeVariant,
): MaterialSchemeResult<"hex">[];
/** Return palette schemes with runtime-selected options; empty input yields `[]`. */
export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  options: MaterialSchemeInput,
): MaterialSchemeResult<ColorFormat>[];
export function createMaterialSchemesFromPalette(
  paletteArgb: readonly number[],
  options: MaterialSchemeInput = {},
): MaterialSchemeResult<ColorFormat>[] {
  options = resolveMaterialSchemeOptions(options);
  return paletteArgb.map((sourceArgb, index) => ({
    id: String(index + 1),
    name: `Palette-${index + 1}`,
    ...createMaterialScheme(sourceArgb, options),
  }));
}

/**
 * Generate schemes for available named ARGB swatches, skipping undefined values.
 * @param swatchArgb - Six swatch keys containing packed seeds or `undefined`.
 * @param options - Scheme options (hex/tonalSpot/0 by default), or a variant name.
 * @returns Results in `SWATCH_ROLES` order: Vibrant, DarkVibrant, LightVibrant,
 * Muted, DarkMuted, LightMuted. Both id and name equal the swatch key; each result
 * includes sourceColor and role-first light/dark colors. All unavailable yields
 * `[]` without validating scheme options; zero is a valid seed, not a missing one.
 * @throws {RangeError} For invalid ARGB or contrast when a swatch is available.
 * @throws {Error} If an upstream required role is missing.
 */
export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  options?: MaterialSchemeOptions & { format?: "hex" },
): MaterialSchemeResult<"hex">[];
/** Return available swatch schemes in format Format; alpha follows {@link createMaterialScheme}. */
export function createMaterialSchemesFromSwatches<Format extends ColorFormat>(
  swatchArgb: SwatchColorMap<"argb">,
  options: MaterialSchemeFormatOptions<Format>,
): MaterialSchemeResult<Format>[];
/** Variant-name shorthand; return available swatch schemes in hex at standard contrast. */
export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  scheme: MaterialSchemeVariant,
): MaterialSchemeResult<"hex">[];
/** Return available swatch schemes with runtime-selected options, in canonical swatch order. */
export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  options: MaterialSchemeInput,
): MaterialSchemeResult<ColorFormat>[];
export function createMaterialSchemesFromSwatches(
  swatchArgb: SwatchColorMap<"argb">,
  options: MaterialSchemeInput = {},
): MaterialSchemeResult<ColorFormat>[] {
  options = resolveMaterialSchemeOptions(options);
  return SWATCH_ROLES.flatMap((swatchRole) => {
    const sourceArgb = swatchArgb[swatchRole];
    return sourceArgb === undefined
      ? []
      : [
          {
            id: swatchRole,
            name: swatchRole,
            ...createMaterialScheme(sourceArgb, options),
          },
        ];
  });
}

/**
 * Extract opaque image seeds and generate a scheme for each selected color.
 * @param imageSource - Color Thief image input supported by the current runtime.
 * @param options - Defaults: dominant extraction, hex, tonalSpot, contrast 0;
 * palette mode requests 3 colors unless paletteSize is supplied.
 * @returns A promise of results with sourceColor, role-first light/dark colors,
 * and strategy metadata: dominant yields at most one (`dominant`/`Dominant`);
 * palette preserves extraction order (`"1"`/`"Palette-1"`, ...); swatches use
 * `SWATCH_ROLES` order with the swatch key as id and name. No extractable colors
 * yields `[]`, not an error; contrast is checked only if a seed is generated.
 * @throws {RangeError} Rejects for paletteSize outside integer 2..20 in palette
 * mode, or invalid contrast when a seed is available.
 * @throws {Error} Rejects on image loading/decoding/extraction failures or a
 * missing upstream Material role; extraction errors are propagated unchanged.
 * @example
 * const themes = await createMaterialSchemesFromImage(imageSource, {
 *   extractionMode: "palette", paletteSize: 3, format: "oklch",
 * });
 * const primary = themes[0]?.colors.primary.light;
 */
export function createMaterialSchemesFromImage(
  imageSource: ImageSource,
  options?: MaterialSchemeImageOptions & { format?: "hex" },
): Promise<MaterialSchemeResult<"hex">[]>;
/** Extract image schemes in format Format; see the default overload for ordering, empty results, and errors. */
export function createMaterialSchemesFromImage<Format extends ColorFormat>(
  imageSource: ImageSource,
  options: MaterialSchemeImageOptions & MaterialSchemeFormatOptions<Format>,
): Promise<MaterialSchemeResult<Format>[]>;
/** Extract image schemes with runtime-selected options; resolves to an array, possibly empty. */
export function createMaterialSchemesFromImage(
  imageSource: ImageSource,
  options: MaterialSchemeImageOptions,
): Promise<MaterialSchemeResult<ColorFormat>[]>;
export async function createMaterialSchemesFromImage(
  imageSource: ImageSource,
  options: MaterialSchemeImageOptions = {},
): Promise<MaterialSchemeResult<ColorFormat>[]> {
  switch (options.extractionMode ?? "dominant") {
    case "dominant": {
      const dominantArgb = await extractDominantColor(imageSource, "argb");
      return dominantArgb === undefined
        ? []
        : createMaterialSchemesFromDominantColor(dominantArgb, options);
    }
    case "palette": {
      const paletteArgb = await extractPaletteColors(
        imageSource,
        "argb",
        options.paletteSize,
      );
      return createMaterialSchemesFromPalette(paletteArgb ?? [], options);
    }
    case "swatch":
      return createMaterialSchemesFromSwatches(
        await extractSwatchColors(imageSource, "argb"),
        options,
      );
  }
}

/** @deprecated Use {@link MATERIAL_SCHEMES} instead. */
export { MATERIAL_SCHEMES as SCHEMES };

/** @deprecated Use {@link MaterialSchemeVariant} instead. */
export type SchemeVariant = MaterialSchemeVariant;

/** @deprecated Use {@link MaterialSchemeOptions} instead. */
export type SchemeOptions = MaterialSchemeOptions;

/** @deprecated Use {@link MaterialSchemeFormatOptions} instead. */
export type SchemeFormatOptions<Format extends ColorFormat> =
  MaterialSchemeFormatOptions<Format>;

/** @deprecated Use {@link MaterialSchemeImageOptions} instead. */
export type ImageSchemeOptions = MaterialSchemeImageOptions;

/** @deprecated Use {@link createMaterialScheme} instead. */
export { createMaterialScheme as schemeFromSourceColor };

/** @deprecated Use {@link createMaterialSchemesFromDominantColor} instead. */
export { createMaterialSchemesFromDominantColor as schemeFromDominantColor };

/** @deprecated Use {@link createMaterialSchemesFromPalette} instead. */
export { createMaterialSchemesFromPalette as schemeFromPaletteColors };

/** @deprecated Use {@link createMaterialSchemesFromSwatches} instead. */
export { createMaterialSchemesFromSwatches as schemeFromSwatchColors };

/** @deprecated Use {@link createMaterialSchemesFromImage} instead. */
export { createMaterialSchemesFromImage as schemeFromImageToColor };
