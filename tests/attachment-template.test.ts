import { describe, expect, test } from "bun:test";
import { hexToArgb } from "../src/convert";
import { schemeFromSourceColor } from "../src/attachment/color";
import { render } from "../src/template";

describe("role-oriented Material schemes", () => {
  test("stores light and dark values under every role", () => {
    const result = schemeFromSourceColor(hexToArgb("#6750a4"));
    expect(result.colors.primary.light).toBeDefined();
    expect(result.colors.primary.dark).toBeDefined();
    expect(result.colors.primary.light).not.toBe(result.colors.primary.dark);
  });
});

describe("template renderer", () => {
  test("renders dynamic role and mode paths inside a loop", () => {
    const result = schemeFromSourceColor(hexToArgb("#6750a4"));
    expect(render(
      "{{#each colors as role}}{{colors.(role).(mode)}};{{/each}}",
      { colors: result.colors, mode: "dark" },
    )).toContain("#");
  });

  test("supports explicit each aliases", () => {
    expect(render(
      "{{#each colors as color}}{{color.name}}={{color.value}};{{/each}}",
      { colors: [{ name: "primary", value: "#6750a4" }] },
    )).toBe("primary=#6750a4;");
  });

  test("uses literal values for unbound parenthesized path segments", () => {
    expect(render("{{colors.primary.(light)}}", {
      colors: { primary: { light: "#6750a4" } },
    })).toBe("#6750a4");
  });
});
