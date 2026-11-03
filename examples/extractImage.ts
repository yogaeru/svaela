/**
 * Image extraction tour: `bun run example:extract` from the project root.
 * Loads images/1.png through Color Thief's Node loader (requires sharp), prints
 * dominant/palette/swatch values, then generates role-first materialSchemesByExtractionMode in each mode.
 * Direct extraction can return undefined; imageSource scheme generation returns arrays.
 * @module
 */
import { fileURLToPath } from "node:url";

import {
  extractDominantColor,
  extractPaletteColors,
  extractSwatchColors,
  createMaterialSchemesFromImage,
  SWATCH_ROLES,
} from "../index";

/** Load the bundled imageSource and print results; decoding/extraction errors propagate. */
async function main() {
  const imageSource = fileURLToPath(new URL("../images/1.png", import.meta.url));
  const dominantColor = await extractDominantColor(imageSource, "hsl");
  const paletteColors = await extractPaletteColors(imageSource, "rgb", 5);
  const swatchColors = await extractSwatchColors(imageSource, "hex");
  const dominantArgb = await extractDominantColor(imageSource, "argb");
  const paletteOklchColors = await extractPaletteColors(imageSource, "oklch", 3);

  const materialSchemesByExtractionMode = await Promise.all(
    (["dominant", "palette", "swatch"] as const).map((extractionMode) =>
      createMaterialSchemesFromImage(imageSource, {
        format: "hex",
        extractionMode,
        paletteSize: 5,
        scheme: "tonalSpot",
        contrastLevel: 0,
      }),
    ),
  );

  console.log("Dominant Color:", dominantColor);
  console.log("Dominant ARGB:", dominantArgb);
  console.log("Palette Colors:", paletteColors);
  console.log("Palette OKLCH:", paletteOklchColors);
  console.log("Swatch Colors:", swatchColors);
  console.log("Swatch Names:", SWATCH_ROLES);
  console.log("Schemes from Image:", materialSchemesByExtractionMode);
}
await main();
