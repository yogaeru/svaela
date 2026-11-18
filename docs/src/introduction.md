# Introduction

`svaela` is a typed TypeScript library for extracting colors from images, converting between common color representations, generating Material 3 light/dark color schemes, and rendering small text templates. Its public API is exposed from the package entry point; applications should import from `svaela`, not from internal source paths.

## Features

- Extract a dominant color, a ranked palette, or six semantic Color Thief swatches.
- Convert between hexadecimal, packed ARGB, RGB(A), HSL(A), HSV(A), and OKLCH.
- Generate Material 3 schemes from ARGB seeds, palettes, swatches, or images.
- Render plain-text templates with placeholders, dynamic property segments, sections, and loops.
- Use typed format keys so TypeScript can infer the corresponding color value.

## Workflow

```text
Image / Color Seed
       |
       v
 Extract Colors (optional)
       |
       v
 Convert to ARGB / Color Format
       |
       v
 Material 3 Scheme (light + dark)
       |
       v
 Render Template (optional)
       |
       v
 CSS / Theme Text Output
```

Image extraction is optional: a scheme can be generated directly from a packed ARGB seed. The generated role map is role-first, for example `colors.primary.light` and `colors.primary.dark`.

## Public API

All supported package exports are re-exported from the package root (`svaela`). The package currently declares a single public export path (`.`); internal source paths are not public import paths. See [Getting Started](getting-started.md) and the [API modules](core/extract.md).
