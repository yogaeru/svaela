export const SWATCH_NAMES = [
  "Vibrant",
  "DarkVibrant",
  "LightVibrant",
  "Muted",
  "DarkMuted",
  "LightMuted",
] as const;

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
] as const;

export const MaterialYouColors = {
  background: {
    background: "The absolute background of the app/screen",
    on_background: "Text on the main background",
  },

  primary: {
    primary: "Main brand color",
    on_primary: "Text/Icons on top of primary",
    primary_container: "Subtle background for primary elements",
    on_primary_container: "Text on top of primary container",
    primary_fixed: "Fixed primary color across light and dark themes",
    primary_fixed_dim: "Stronger fixed primary color",
    on_primary_fixed: "Text/icons on primary fixed color",
    on_primary_fixed_variant: "Lower emphasis text on primary fixed",
    inverse_primary: "Primary color for opposite theme",
  },

  secondary: {
    secondary: "Less prominent accent color",
    on_secondary: "Text/Icons on top of secondary",
    secondary_container: "Subtle background for secondary elements",
    on_secondary_container: "Text on top of secondary container",
    secondary_fixed: "Fixed secondary color across themes",
    secondary_fixed_dim: "Stronger fixed secondary color",
    on_secondary_fixed: "Text/icons on secondary fixed color",
    on_secondary_fixed_variant: "Lower emphasis text on secondary fixed",
  },

  tertiary: {
    tertiary: "Contrasting accent color for balance",
    on_tertiary: "Text/Icons on top of tertiary",
    tertiary_container: "Subtle background for tertiary elements",
    on_tertiary_container: "Text on top of tertiary container",
    tertiary_fixed: "Fixed tertiary color across themes",
    tertiary_fixed_dim: "Stronger fixed tertiary color",
    on_tertiary_fixed: "Text/icons on tertiary fixed color",
    on_tertiary_fixed_variant: "Lower emphasis text on tertiary fixed",
  },

  error: {
    error: "Color used for errors/warnings",
    on_error: "Text/Icons on top of error color",
    error_container: "Background for error messages and alerts",
    on_error_container: "Text/icons on error container",
  },

  surface: {
    surface: "Main background for components (cards, sheets)",
    on_surface: "Primary text color on surfaces",
    surface_dim: "Dimmest surface color",
    surface_bright: "Brightest surface color",
    surface_container_lowest: "Lowest emphasis surface container",
    surface_container_low: "Low emphasis surface container",
    surface_container: "Default surface container",
    surface_container_high: "High emphasis surface container",
    surface_container_highest: "Highest emphasis surface container",
    on_surface_variant: "Secondary text color on surfaces",
  },

  inverse: {
    inverse_surface: "Surface color used in the opposite theme",
    inverse_on_surface: "Text/icons on inverse surface",
  },

  outline: {
    outline: "Color for borders and dividers",
    outline_variant: "Subtle divider/border color",
  },
} as const;

export type MaterialYouSection = keyof typeof MaterialYouColors;

/** Union of every role name, e.g. "primary" | "on_primary" | ... */
export type MaterialYouRole = {
  [S in MaterialYouSection]: keyof (typeof MaterialYouColors)[S];
}[MaterialYouSection];

/** Flat map of role -> description, for lookups without knowing the section. */
export const materialYouRoleDescriptions = Object.fromEntries(
  Object.values(MaterialYouColors).flatMap((section) => Object.entries(section)),
) as Record<MaterialYouRole, string>;