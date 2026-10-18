export type TemplateData = Record<string, unknown>;

interface Context {
  value: unknown;
  parent?: Context;
  variables: Record<string, unknown>;
}

function lookup(context: Context, path: string): unknown {
  const normalized = path.trim();
  if (normalized === "this") return context.value;
  if (normalized.startsWith("../")) {
    return context.parent ? lookup(context.parent, normalized.slice(3)) : undefined;
  }

  const parts: string[] = normalized.match(/\([^)]*\)|[^.]+/g) ?? [];
  let value: unknown;
  const first = parts.shift()!;
  const firstKey = first.startsWith("(")
    ? String(context.variables[first.slice(1, -1)] ?? first.slice(1, -1))
    : first;
  if (firstKey in context.variables) {
    value = context.variables[firstKey];
  } else {
    value = context.value;
    parts.unshift(firstKey);
  }
  for (const part of parts) {
    if (value === null || typeof value !== "object") return undefined;
    const key = part.startsWith("(")
      ? String(context.variables[part.slice(1, -1)] ?? part.slice(1, -1))
      : part;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function renderTemplate(template: string, context: Context): string {
  template = template.replace(
    /{{#each\s+([\w.]+)(?:\s+as\s+(\w+))?}}([\s\S]*?){{\/each}}/g,
    (_, path: string, variable: string | undefined, body: string) => {
      const value = lookup(context, path);
      const entries = Array.isArray(value)
        ? value.map((item, index) => [String(index), item] as const)
        : value !== null && typeof value === "object"
          ? Object.entries(value)
          : [];
      return entries.map(([key, item], index) => renderTemplate(body, {
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
      const value = lookup(context, path);
      if (Array.isArray(value)) {
        return value.map((item) => renderTemplate(body, {
          value: item,
          parent: context,
          variables: context.variables,
        })).join("");
      }
      return value ? renderTemplate(body, context) : "";
    },
  );
  return template.replace(/{{\s*([^{}]+?)\s*}}/g, (_, path: string) => {
    const value = lookup(context, path);
    return value == null ? "" : String(value);
  });
}

/** Render values and `#each`/section loops without HTML escaping. */
export function render<T extends TemplateData>(template: string, data: T): string {
  return renderTemplate(template, { value: data, variables: data });
}
