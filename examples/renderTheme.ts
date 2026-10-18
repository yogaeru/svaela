import {
  MATERIAL_ROLES,
  renderTemplate,
  schemeFromSourceColor,
} from "../index";
import type { MaterialRole } from "../index";

const theme = schemeFromSourceColor(0xff6750a4);
const roles = Object.fromEntries(
  MATERIAL_ROLES.map((role: MaterialRole) => [role, theme.colors[role]]),
);
const css = renderTemplate(
  `:root {
{{#each colors as role}}  --{{role}}-light: {{colors.(role).(light)}};
  --{{role}}-dark: {{colors.(role).(dark)}};
{{/each}}}`,
  { colors: theme.colors },
);

console.log(css);

console.log(renderTemplate(
  "{{#each roles as role}}{{role}}={{colors.(role).(mode)}},{{/each}}",
  { roles, colors: theme.colors, mode: "light" },
));

console.log(renderTemplate(
  "{{#colors}}{{primary.light}} / {{primary.dark}}{{/colors}}",
  { colors: theme.colors },
));

console.log(renderTemplate(
  "{{#each items as item}}{{item.name}}={{item.value}};{{/each}}",
  { items: [{ name: "brand", value: theme.colors.primary.light }] },
));
