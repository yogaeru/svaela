/**
 * Material scheme tour: `bun run example:scheme` from the project root.
 * Demonstrates role-first light/dark results, variants, formats, contrast, and
 * metadata-bearing arrays. The final section decodes images/1.png and requires
 * sharp; the sourceArgb-based sections do not load images.
 * @module
 */
import { fileURLToPath } from "bun";

import {
  hexToArgb,
  MATERIAL_ROLES,
  MATERIAL_SCHEMES,
  createMaterialSchemesFromDominantColor,
  createMaterialSchemesFromImage,
  createMaterialSchemesFromPalette,
  createMaterialScheme,
  createMaterialSchemesFromSwatches,
} from "../index"
import type { MaterialSchemeImageOptions, SwatchColorMap } from "../index";

const sourceArgb = hexToArgb("#6750a4");
const materialScheme = createMaterialScheme(sourceArgb);

console.log("Source color:", materialScheme.sourceColor);
console.log("Primary light:", materialScheme.colors.primary.light);
console.log("Primary dark:", materialScheme.colors.primary.dark);
console.log("Role count:", MATERIAL_ROLES.length);
console.log("Schemes:", Object.keys(MATERIAL_SCHEMES));

for (const format of [
  "hex",
  "argb",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "oklch",
] as const) {
  const materialScheme = createMaterialScheme(sourceArgb, {
    format,
    scheme: "expressive",
    contrastLevel: 0.5,
  });
  console.log(`${String(format)} primary:`, materialScheme.colors.primary);
}

for (const scheme of Object.keys(MATERIAL_SCHEMES) as Array<keyof typeof MATERIAL_SCHEMES>) {
  const materialScheme = createMaterialScheme(sourceArgb, { scheme, format: "hex" });
  console.log(`${String(scheme)} primary:`, materialScheme.colors.primary.light);
}

console.log("Dominant:", createMaterialSchemesFromDominantColor(sourceArgb));
console.log("Palette:", createMaterialSchemesFromPalette([sourceArgb, 0xff3366cc, sourceArgb]));

const swatchArgb: SwatchColorMap<"argb"> = {
  Vibrant: sourceArgb,
  DarkVibrant: 0xff3366cc,
  LightVibrant: undefined,
  Muted: 0xff777777,
  DarkMuted: undefined,
  LightMuted: 0xffbbbbbb,
};
console.log("Swatches:", createMaterialSchemesFromSwatches(swatchArgb, { format: "hex" }));

const imageOptions: MaterialSchemeImageOptions = {
  format: "hex",
  scheme: "vibrant",
  contrastLevel: -0.25,
  extractionMode: "palette",
  paletteSize: 5,
};
console.log("Image options:", imageOptions);

const imageSource = fileURLToPath(new URL("../images/1.png", import.meta.url));
for (const extractionMode of ["dominant", "palette", "swatch"] as const) {
  console.log(
    `Image ${String(extractionMode)}:`,
    await createMaterialSchemesFromImage(imageSource, { ...imageOptions, extractionMode }),
  );
}
