# Theme Template

## Overview

The template module exports `renderTemplate`, a synchronous plain-text renderer intended for small theme exports. It supports dotted property lookup, parent loop context (`../`), dynamic property segments (`(variable)`), array/object `#each` loops, array shorthand sections, and truthy sections. It is not a full Handlebars implementation.

Values that are missing or `null` render as an empty string; other values are converted with `String(value)`. Rendering does not HTML-escape or sanitize output. Do not insert untrusted rendered text into HTML. Block matching is regular-expression-based, so avoid nested `#each` blocks and recursively nested sections with the same name.

## How to Use

### Render a simple placeholder

```ts
import { renderTemplate } from "svaela";

const css = renderTemplate(
  ":root { --primary: {{colors.primary}}; }",
  { colors: { primary: "#6750a4" } },
);
```

### Iterate an object with a dynamic property

```ts
import { renderTemplate } from "svaela";

const css = renderTemplate(
  "{{#each colors as role}}--{{role}}: {{colors.(role).(mode)}};\n{{/each}}",
  {
    colors: {
      primary: { light: "#6750a4", dark: "#d0bcff" },
      secondary: { light: "#006874", dark: "#4fd8eb" },
    },
    mode: "dark",
  },
);
```

### Access a parent context

```ts
const output = renderTemplate(
  "{{#each groups as group}}{{#each group.items as item}}{{../name}}: {{item}};{{/each}}{{/each}}",
  { groups: [{ name: "colors", items: ["primary", "secondary"] }] },
);
```

## Template Syntax

| Syntax | Behavior |
|---|---|
| `{{user.name}}` | Resolve a dotted property path. |
| `{{../name}}` | Resolve a value in the parent loop context; repeat `../` to ascend. |
| `{{colors.(role).(mode)}}` | Use variable values as dynamic property keys. Missing/null variables fall back to the literal segment name. |
| `{{#each items as item}}...{{/each}}` | Iterate arrays or objects. Alias is the array item or object key; `this` is the value and `index` is zero-based. |
| `{{#each items}}...{{/each}}` | Iterate with `this` and `index` only. |
| `{{#items}}...{{/items}}` | Iterate an array with each element as current context; for non-arrays, render once in the unchanged context if truthy. |
| `{{#enabled}}...{{/enabled}}` | Render a non-array section once in the unchanged context if truthy. |

Root variables remain available inside loops. Aliases and root variables take precedence over current-item fields. The input data is not mutated. There are no template helpers, includes, or file I/O.

## API Reference

### `TemplateData`

```ts
export type TemplateData = Record<string, unknown>;
```

Root template data object. Values are intentionally typed as `unknown`; runtime values are stringified or traversed by the renderer.

### `renderTemplate`

```ts
export function renderTemplate<Data extends TemplateData>(
  template: string,
  data: Data,
): string;
```

Renders `template` using the supplied root data and local loop contexts.

| Name | Type | Default | Description |
|---|---|---|---|
| `template` | `string` | — | Text containing double-brace placeholders and supported sections. |
| `data` | `Data extends TemplateData` | — | Root object whose values are available to placeholders. |

Returns the rendered string. It does not trim whitespace, escape HTML, or sanitize values.

```ts
renderTemplate("Hello, {{name}}!", { name: "Svaela" });
// "Hello, Svaela!"
```

The source module also exports `render` as a deprecated alias, but the package entry point exposes `renderTemplate` as its public template function.
