/**
 * Shared color representations and role-oriented Material scheme results.
 * Numeric channels must be finite; conversion functions validate their ranges.
 * Type declarations alone do not validate values at runtime.
 * @module
 */

/** Image input accepted by Color Thief; supported sources depend on the runtime. */
export type { ImageSource } from "colorthief";

/** sRGB channels in 0..255; fractional channels are allowed. No alpha channel. */
export interface RGB {
  /** Red, 0..255. */
  r: number;
  /** Green, 0..255. */
  g: number;
  /** Blue, 0..255. */
  b: number;
}

/** sRGB with explicit alpha; packing as ARGB rounds channels to bytes. */
export interface RGBA extends RGB {
  /** Alpha, 0 (transparent) to 1 (opaque). */
  a: number;
}

/** HSL in degrees and percentages, not unit saturation/lightness. */
export interface HSL {
  /** Finite hue in degrees; conversion wraps it into [0, 360). */
  h: number;
  /** Saturation, 0..100 percent. */
  s: number;
  /** Lightness, 0..100 percent. */
  l: number;
}

/** HSL with explicit alpha. */
export interface HSLA extends HSL {
  /** Alpha, 0 (transparent) to 1 (opaque). */
  a: number;
}

/** HSV in degrees and percentages, not unit saturation/value. */
export interface HSV {
  /** Finite hue in degrees; conversion wraps it into [0, 360). */
  h: number;
  /** Saturation, 0..100 percent. */
  s: number;
  /** Value (brightness), 0..100 percent. */
  v: number;
}

/** HSV with explicit alpha. */
export interface HSVA extends HSV {
  /** Alpha, 0 (transparent) to 1 (opaque). */
  a: number;
}

/** OKLCH with unit lightness and required alpha; conversion clips to sRGB gamut. */
export interface OKLCH {
  /** Lightness, 0..1 (not a percentage). */
  l: number;
  /** Finite, nonnegative chroma; not a percentage and has no fixed upper bound. */
  c: number;
  /** Finite hue in degrees; conversion wraps it into [0, 360). */
  h: number;
  /** Alpha, 0 (transparent) to 1 (opaque). */
  a: number;
}

/** Format-to-value lookup used to infer conversion and scheme return types. */
export interface ColorFormatMap {
  /** Input: #rgb, #rgba, #rrggbb, #rrggbbaa; output: lowercase #rrggbb[aa]. */
  hex: string;
  /** Packed 0xAARRGGBB; signed/unsigned 32-bit input, unsigned output. */
  argb: number;
  /** sRGB without alpha; converting from ARGB discards alpha. */
  rgb: RGB;
  /** sRGB with unit alpha. */
  rgba: RGBA;
  /** HSL without alpha; converting from ARGB discards alpha. */
  hsl: HSL;
  /** HSL with unit alpha. */
  hsla: HSLA;
  /** HSV without alpha; converting from ARGB discards alpha. */
  hsv: HSV;
  /** HSV with unit alpha. */
  hsva: HSVA;
  /** OKLCH with unit alpha. */
  oklch: OKLCH;
}

/** Supported color representation names; scheme helpers default to `"hex"`. */
export type ColorFormat = keyof ColorFormatMap;
/** Value associated with a format; defaults to the union of all supported shapes. */
export type ColorValue<Format extends ColorFormat = ColorFormat> = ColorFormatMap[Format];

/** Named image swatch categories, in the canonical order of `SWATCH_ROLES`. */
export type SwatchRole =
  | "Vibrant"
  | "DarkVibrant"
  | "LightVibrant"
  | "Muted"
  | "DarkMuted"
  | "LightMuted";

/** Material semantic color roles, using the upstream snake_case names. */
export type MaterialRole =
  | "background"
  | "on_background"
  | "surface"
  | "surface_dim"
  | "surface_bright"
  | "surface_container_lowest"
  | "surface_container_low"
  | "surface_container"
  | "surface_container_high"
  | "surface_container_highest"
  | "on_surface"
  | "on_surface_variant"
  | "outline"
  | "outline_variant"
  | "inverse_surface"
  | "inverse_on_surface"
  | "primary"
  | "primary_dim"
  | "on_primary"
  | "primary_container"
  | "on_primary_container"
  | "primary_fixed"
  | "primary_fixed_dim"
  | "on_primary_fixed"
  | "on_primary_fixed_variant"
  | "inverse_primary"
  | "secondary"
  | "secondary_dim"
  | "on_secondary"
  | "secondary_container"
  | "on_secondary_container"
  | "secondary_fixed"
  | "secondary_fixed_dim"
  | "on_secondary_fixed"
  | "on_secondary_fixed_variant"
  | "tertiary"
  | "tertiary_dim"
  | "on_tertiary"
  | "tertiary_container"
  | "on_tertiary_container"
  | "tertiary_fixed"
  | "tertiary_fixed_dim"
  | "on_tertiary_fixed"
  | "on_tertiary_fixed_variant"
  | "error"
  | "error_dim"
  | "on_error"
  | "error_container"
  | "on_error_container";

/** The two modes generated together for every Material role. */
export type SchemeMode = "light" | "dark";
/**
 * Complete role-first map: `colors.primary.light`, not `colors.light.primary`.
 * Every role has both modes in Format; generated role colors are opaque.
 */
export type MaterialSchemeColors<Format extends ColorFormat> = Record<
  MaterialRole,
  Record<SchemeMode, ColorValue<Format>>
>;

/** A source and its complete light/dark role map; Format defaults to hex strings. */
export interface MaterialScheme<Format extends ColorFormat = "hex"> {
  /** Original seed in Format; alpha is retained only in alpha-capable formats. */
  sourceColor: ColorValue<Format>;
  /** Opaque generated role colors; seed alpha does not control role opacity. */
  colors: MaterialSchemeColors<Format>;
}

/** A scheme with extraction metadata; array helpers preserve their source order. */
export interface MaterialSchemeResult<Format extends ColorFormat = "hex">
  extends MaterialScheme<Format> {
  /** `dominant`, a 1-based palette index string, or a swatch category name. */
  id: string;
  /** `Dominant`, `Palette-N` (1-based), or the swatch category name. */
  name: string;
}

/** Type-level lookup of the source-and-colors scheme for each output format. */
export type MaterialSchemeFormatMap = {
  [Format in ColorFormat]: MaterialScheme<Format>;
};
/** Optional swatch-keyed schemes; unlike the array returned by swatch helpers. */
export type SwatchMaterialSchemeMap<Format extends ColorFormat = "hex"> = Partial<
  Record<SwatchRole, MaterialScheme<Format>>
>;

/** All six swatch keys are present; unavailable colors have value `undefined`. */
export type SwatchColorMap<Format extends ColorFormat> = Record<
  SwatchRole,
  ColorValue<Format> | undefined
>;

/** Image seed selection strategy; image scheme generation defaults to dominant. */
export type ColorExtractionMode = "dominant" | "palette" | "swatch";
/**
 * Type-level map of extraction strategies to result arrays (possibly empty).
 * `createMaterialSchemesFromImage` returns one strategy's array, not this whole map.
 */
export type MaterialSchemeResultsByExtractionMode<Format extends ColorFormat = "hex"> = Record<
  ColorExtractionMode,
  MaterialSchemeResult<Format>[]
>;

/** @deprecated Use {@link ColorValue}. */
export type ColorResult<Format extends ColorFormat> = ColorValue<Format>;

/** @deprecated Use {@link SwatchRole}. */
export type SwatchVariant = SwatchRole;

/** @deprecated Use {@link SchemeMode}. */
export type ThemeMode = SchemeMode;

/** @deprecated Use {@link MaterialSchemeColors}. */
export type SchemeColors<Format extends ColorFormat> = MaterialSchemeColors<Format>;

/** @deprecated Use {@link MaterialScheme}. */
export type MaterialColorResponse<Format extends ColorFormat = "hex"> = MaterialScheme<Format>;

/** @deprecated Use {@link MaterialSchemeColors}; this legacy alias defaults to hex. */
export type SchemeResponse<Format extends ColorFormat = "hex"> = MaterialSchemeColors<Format>;

/** @deprecated Use {@link MaterialSchemeFormatMap}. */
export type MaterialColorResponseMap = MaterialSchemeFormatMap;

/** @deprecated Use {@link SwatchMaterialSchemeMap}. */
export type SwatchSchemeMap<Format extends ColorFormat = "hex"> = SwatchMaterialSchemeMap<Format>;

/** @deprecated Use {@link ColorExtractionMode}. */
export type ColorExtractionType = ColorExtractionMode;

/** @deprecated Use {@link MaterialSchemeResultsByExtractionMode}. */
export type ImageSchemeResultMap<Format extends ColorFormat = "hex"> = MaterialSchemeResultsByExtractionMode<Format>;
