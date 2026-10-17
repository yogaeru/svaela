export type TemplateData = Record<string, unknown>;

type Context = {
  data: TemplateData;
  parent?: Context;
};

function getValue(context: Context, path: string): unknown {
  // ../user.name
  if (path.startsWith("../")) {
    return context.parent ? getValue(context.parent, path.slice(3)) : undefined;
  }

  // current context
  return path.split(".").reduce<unknown>((value, key) => {
    if (value === null || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
  }, context.data);
}

function renderTemplate(template: string, context: Context): string {
  // loops
  template = template.replace(
    /{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g,
    (_, key: string, content: string) => {
      const value = getValue(context, key);

      if (!Array.isArray(value)) {
        return "";
      }

      return value
        .map((item) => {
          if (item === null || typeof item !== "object") {
            return "";
          }

          return renderTemplate(content, {
            data: item as TemplateData,
            parent: context,
          });
        })
        .join("");
    },
  );

  // values
  return template.replace(
    /{{\s*([\w.]+|(?:\.\.\/)+[\w.]+)\s*}}/g,
    (_, key: string) => {
      const value = getValue(context, key);

      return value == null ? "" : String(value);
    },
  );
}

/** Render placeholders and array sections as plain text, without HTML escaping. */
export function render<T extends TemplateData>(template: string, data: T): string {
  return renderTemplate(template, {
    data,
  });
}


