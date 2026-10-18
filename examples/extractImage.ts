import { fileURLToPath } from "node:url";

import {
  getDominantColorFromImage,
  getPaletteColorFromImage,
  getSwatchColorFromImage,
  schemeFromImageToColor,
  SWATCH_NAMES,
} from "../index";

async function main() {
  const image = fileURLToPath(new URL("../images/1.png", import.meta.url));
  const dominantColor = await getDominantColorFromImage(image, "hsl");
  const paletteColors = await getPaletteColorFromImage(image, "rgb", 5);
  const swatchColors = await getSwatchColorFromImage(image, "hex");
  const dominantArgb = await getDominantColorFromImage(image, "argb");
  const paletteOklch = await getPaletteColorFromImage(image, "oklch", 3);

  const schemes = await Promise.all(
    (["dominant", "palette", "swatch"] as const).map((colorType) =>
      schemeFromImageToColor(image, {
        format: "hex",
        colorType,
        paletteSize: 5,
        scheme: "tonalSpot",
        contrastLevel: 0,
      }),
    ),
  );

  console.log("Dominant Color:", dominantColor);
  console.log("Dominant ARGB:", dominantArgb);
  console.log("Palette Colors:", paletteColors);
  console.log("Palette OKLCH:", paletteOklch);
  console.log("Swatch Colors:", swatchColors);
  console.log("Swatch Names:", SWATCH_NAMES);
  console.log("Schemes from Image:", schemes);
}
await main();
