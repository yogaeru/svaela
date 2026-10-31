/**
 * Small, synchronous plain-text renderer exported as `renderTemplate` by svaela.
 *
 * Supports dotted paths, parent paths (`../`), dynamic segments (`(variable)`),
 * truthy sections, and array/object `#each` loops. It is not a Handlebars parser:
 * nested `#each` blocks or sections with the same name are not reliably supported.
 * Values are stringified without HTML escaping; do not inject untrusted output
 * as HTML or treat rendering as sanitization.
 *
 * @module
 */

/** Root variables available to placeholders and inherited by loop contexts. */
export type TemplateData = Record<string, unknown>;

interface TemplateContext {
  value: unknown;
  parent?: TemplateContext;
  variables: Record<string, unknown>;
}

/** Resolve aliases/root variables before current-item fields; ../ selects a parent. */
function resolveTemplateValue(context: TemplateContext, path: string): unknown {
  const normalizedPath = path.trim();
  if (normalizedPath === "this") return context.value;
  if (normalizedPath.startsWith("../")) {
    return context.parent ? resolveTemplateValue(context.parent, normalizedPath.slice(3)) : undefined;
  }

  const pathSegments: string[] = normalizedPath.match(/\([^)]*\)|[^.]+/g) ?? [];
  let value: unknown;
  const firstSegment = pathSegments.shift()!;
  const firstPropertyKey = firstSegment.startsWith("(")
    ? String(context.variables[firstSegment.slice(1, -1)] ?? firstSegment.slice(1, -1))
    : firstSegment;
  if (firstPropertyKey in context.variables) {
    value = context.variables[firstPropertyKey];
  } else {
    value = context.value;
    pathSegments.unshift(firstPropertyKey);
  }
  for (const pathSegment of pathSegments) {
    if (value === null || typeof value !== "object") return undefined;
    const key = pathSegment.startsWith("(")
      ? String(context.variables[pathSegment.slice(1, -1)] ?? pathSegment.slice(1, -1))
      : pathSegment;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function renderTemplateContext(template: string, context: TemplateContext): string {
  template = template.replace(
    /{{#each\s+([\w.]+)(?:\s+as\s+(\w+))?}}([\s\S]*?){{\/each}}/g,
    (_, path: string, variable: string | undefined, body: string) => {
      const value = resolveTemplateValue(context, path);
      const entries = Array.isArray(value)
        ? value.map((item, index) => [String(index), item] as const)
        : value !== null && typeof value === "object"
          ? Object.entries(value)
          : [];
      return entries.map(([key, item], index) => renderTemplateContext(body, {
        value: item,
        parent: context,
        variables: {
          ...context.variables,
          [variable ?? "this"]: Array.isArray(value) ? item : key,
          this: item,
          index,
        },
      })).join("");
    },
  );
  template = template.replace(
    /{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g,
    (_, path: string, body: string) => {
      const value = resolveTemplateValue(context, path);
      if (Array.isArray(value)) {
        return value.map((item) => renderTemplateContext(body, {
          value: item,
          parent: context,
          variables: context.variables,
        })).join("");
      }
      return value ? renderTemplateContext(body, context) : "";
    },
  );
  return template.replace(/{{\s*([^{}]+?)\s*}}/g, (_, path: string) => {
    const value = resolveTemplateValue(context, path);
    return value == null ? "" : String(value);
  });
}

/**
 * Render a text template using root data and local loop contexts.
 *
 * - `{{user.name}}` reads a dotted path; null/missing values become empty strings.
 *   Other values use `String(value)`, including numbers, arrays, and objects.
 * - `{{#each items as item}}...{{/each}}` iterates arrays with `item` bound to the
 *   value, or objects with `item` bound to the key. In both cases `this` is the
 *   value and `index` is zero-based. Without `as`, only `this`/`index` are bound.
 * - `{{#items}}...{{/items}}` iterates an array, making each item the current
 *   context. For non-arrays it renders once in the unchanged context if truthy.
 * - `{{../name}}` reads a parent context; `(variable)` selects a dynamic property
 *   key, falling back to its literal name if the variable is null or missing.
 *
 * Root variables remain available in loops; aliases take precedence. There are
 * no helper functions, HTML escaping, or file operations. Avoid nested `#each`
 * blocks and recursively nested sections with the same name: block matching is
 * regex-based rather than a full template grammar.
 *
 * @param template - Template text using double-brace placeholders and sections.
 * @param data - Root data and variables; not mutated by rendering.
 * @returns The rendered text, with no automatic escaping or whitespace trimming.
 * @example
 * import { renderTemplate } from "svaela";
 *
 * renderTemplate("{{#each items as item}}{{item.name}}={{item.value}};{{/each}}", {
 *   items: [{ name: "brand", value: "#6750a4" }],
 * }); // "brand=#6750a4;"
 * @example
 * import { renderTemplate } from "svaela";
 *
 * renderTemplate("{{#each colors as role}}{{role}}: {{colors.(role).(mode)}};{{/each}}", {
 *   colors: { primary: { light: "#6750a4", dark: "#d0bcff" } },
 *   mode: "dark",
 * }); // "primary: #d0bcff;"
 */
export function renderTemplate<Data extends TemplateData>(template: string, data: Data): string {
  return renderTemplateContext(template, { value: data, variables: data });
}

/** @deprecated Use {@link renderTemplate}. */
export { renderTemplate as render };
