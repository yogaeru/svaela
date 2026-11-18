# Getting Started

## Requirements

`svaela` is an ES module package with TypeScript declarations. Its Node.js image loader uses the optional `sharp` peer dependency. Browser image inputs must already be available and readable by canvas.

## Installation

Choose one package manager:

```sh
bun add svaela
```

```sh
npm install svaela
```

```sh
pnpm add svaela
```

```sh
yarn add svaela
```

For Node.js image extraction, install the optional peer dependency as well:

```sh
bun add sharp
# or: npm install sharp
# or: pnpm add sharp
# or: yarn add sharp
```

## Quick Start

This example reads an image, extracts its dominant color as packed ARGB, creates a Material 3 scheme, and renders a CSS custom property. Run it in an environment where the image path is readable and the Node.js image loader dependency is installed.

```ts
import {
  extractDominantColor,
  createMaterialScheme,
  renderTemplate,
} from "svaela";

const seed = await extractDominantColor("./photo.png", "argb");

if (seed === undefined) {
  console.log("No color could be extracted.");
} else {
  const theme = createMaterialScheme(seed, { format: "hex" });
  const css = renderTemplate(
    ":root { --color-primary: {{primary}}; }",
    { primary: theme.colors.primary.light },
  );
  console.log(css);
}
```

## Choosing an Entry Point

- Use `extractDominantColor`, `extractPaletteColors`, or `extractSwatchColors` when working from an image.
- Use `hexToArgb` or `convertColorToArgb` when a color seed is already available.
- Use `createMaterialScheme` for one seed, or `createMaterialSchemesFrom...` for a list of seeds or an image.
- Use `renderTemplate` when you need to serialize data into a small text-based theme format.

See [Image Extraction](core/extract.md), [Color Conversion](core/convert.md), [Material Scheme](core/material.md), and [Theme Template](core/template.md).
