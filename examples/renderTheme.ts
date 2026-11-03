/**
 * Theme export tour: `bun run example:template` from the project root.
 * Generates a hex scheme and prints CSS plus small template-language examples:
 * object-key aliases, dynamic mode lookup, truthy sections, and array-item aliases.
 * Output is plain text; renderTemplate does not HTML-escape values.
 * @module
 */
import {
  MATERIAL_ROLES,
  renderTemplate,
  createMaterialScheme,
} from "../index";
import type { MaterialRole } from "../index";

const materialScheme = createMaterialScheme(0xff6750a4);
const roleColors = Object.fromEntries(
  MATERIAL_ROLES.map((role: MaterialRole) => [role, materialScheme.colors[role]]),
);
const css = renderTemplate(
  `:root {
{{#each colors as role}}  --{{role}}-light: {{colors.(role).(light)}};
  --{{role}}-dark: {{colors.(role).(dark)}};
{{/each}}}`,
  { colors: materialScheme.colors },
);

console.log(css);

console.log(renderTemplate(
  "{{#each roleColors as role}}{{role}}={{colors.(role).(mode)}},{{/each}}",
  { roleColors, colors: materialScheme.colors, mode: "light" },
));

console.log(renderTemplate(
  "{{#colors}}{{primary.light}} / {{primary.dark}}{{/colors}}",
  { colors: materialScheme.colors },
));

console.log(renderTemplate(
  "{{#each items as item}}{{item.name}}={{item.value}};{{/each}}",
  { items: [{ name: "brand", value: materialScheme.colors.primary.light }] },
));
