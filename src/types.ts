export type { ImageSource } from "colorthief";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL {
  a: number;
}

export interface OKLCH {
  l: number;
  c: number;
  h: number;
  a: number;
}

export interface ColorFormatMap {
  hex: string;
  argb: number;
  rgb: RGB;
  rgba: RGBA;
  hsl: HSL;
  hsla: HSLA;
  oklch: OKLCH;
}

export type ColorFormat = keyof ColorFormatMap;
export type ColorResult<F extends ColorFormat> = ColorFormatMap[F];
export type ColorValue = ColorFormatMap[ColorFormat];

export type SwatchName =
  | "Vibrant"
  | "DarkVibrant"
  | "LightVibrant"
  | "Muted"
  | "DarkMuted"
  | "LightMuted";

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

export type ThemeMode = "light" | "dark";
export type SchemeColors<F extends ColorFormat> = Record<
  MaterialRole,
  Record<ThemeMode, ColorResult<F>>
>;

export interface MaterialColorResponse<F extends ColorFormat = "hex"> {
  sourceColor: ColorResult<F>;
  colors: SchemeColors<F>;
}

export interface MaterialSchemeResult<F extends ColorFormat = "hex">
  extends MaterialColorResponse<F> {
  id: string;
  name: string;
}

export type SchemeResponse<F extends ColorFormat = "hex"> = SchemeColors<F>;
export type MaterialColorResponseMap = {
  [F in ColorFormat]: MaterialColorResponse<F>;
};
export type SwatchSchemeMap<F extends ColorFormat = "hex"> = Partial<
  Record<SwatchName, MaterialColorResponse<F>>
>;

export type SwatchColorMap<F extends ColorFormat> = Record<
  SwatchName,
  ColorResult<F> | undefined
>;

export type ColorExtractionType = "dominant" | "palette" | "swatch";
export type ImageSchemeResultMap<F extends ColorFormat = "hex"> = Record<
  ColorExtractionType,
  MaterialSchemeResult<F>[]
>;
