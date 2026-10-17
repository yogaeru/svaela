import { describe, expect, test } from "bun:test";

const cases = [
  "color adapters",
  "dominant and palette formats",
  "sampling filters",
  "swatch formats and missing roles",
  "palette count forwarding",
  "palette count validation",
  "dominant image schemes and options",
  "palette image schemes are flat and options propagate",
  "swatch image schemes omit missing roles",
  "no colors",
  "errors propagate",
];

describe("image extraction through real Color Thief with custom pixel fixtures", () => {
  test.each(cases)("%s (isolated configuration)", async (name) => {
    // A subprocess prevents configure() state from leaking into any other tests.
    // No image decoder, network, DOM, module mocks, or additional dependencies.
    const child = Bun.spawn([
      process.execPath,
      new URL("./image.fixture.ts", import.meta.url).pathname,
      name,
    ], { stdout: "pipe", stderr: "pipe" });
    const timeout = setTimeout(() => child.kill(), 15_000);
    try {
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      expect({ name, exitCode, stdout, stderr }).toEqual({ name, exitCode: 0, stdout: "", stderr: "" });
    } finally {
      clearTimeout(timeout);
      child.kill();
    }
  }, 20_000);
});
