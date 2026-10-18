import { fileURLToPath } from "bun";

import {
  hexToArgb,
  MATERIAL_ROLES,
  SCHEMES,
  schemeFromDominantColor,
  schemeFromImageToColor,
  schemeFromPaletteColors,
  schemeFromSourceColor,
  schemeFromSwatchColors,
} from "../index"
import type { ImageSchemeOptions, SwatchColorMap } from "../index";

const seed = hexToArgb("#6750a4");
const theme = schemeFromSourceColor(seed);

console.log("Source color:", theme.sourceColor);
console.log("Primary light:", theme.colors.primary.light);
console.log("Primary dark:", theme.colors.primary.dark);
console.log("Role count:", MATERIAL_ROLES.length);
console.log("Schemes:", Object.keys(SCHEMES));

for (const format of [
  "hex",
  "argb",
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "oklch",
] as const) {
  const result = schemeFromSourceColor(seed, {
    format,
    scheme: "expressive",
    contrastLevel: 0.5,
  });
  console.log(`${String(format)} primary:`, result.colors.primary);
}

for (const scheme of Object.keys(SCHEMES) as Array<keyof typeof SCHEMES>) {
  const result = schemeFromSourceColor(seed, { scheme, format: "hex" });
  console.log(`${String(scheme)} primary:`, result.colors.primary.light);
}

console.log("Dominant:", schemeFromDominantColor(seed));
console.log("Palette:", schemeFromPaletteColors([seed, 0xff3366cc, seed]));

const swatches: SwatchColorMap<"argb"> = {
  Vibrant: seed,
  DarkVibrant: 0xff3366cc,
  LightVibrant: undefined,
  Muted: 0xff777777,
  DarkMuted: undefined,
  LightMuted: 0xffbbbbbb,
};
console.log("Swatches:", schemeFromSwatchColors(swatches, { format: "hex" }));

const imageOptions: ImageSchemeOptions = {
  format: "hex",
  scheme: "vibrant",
  contrastLevel: -0.25,
  colorType: "palette",
  paletteSize: 5,
};
console.log("Image options:", imageOptions);

const image = fileURLToPath(new URL("../images/1.png", import.meta.url));
for (const colorType of ["dominant", "palette", "swatch"] as const) {
  console.log(
    `Image ${String(colorType)}:`,
    await schemeFromImageToColor(image, { ...imageOptions, colorType }),
  );
}
