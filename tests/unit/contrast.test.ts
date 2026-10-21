import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Reads the real token values from globals.css so a palette edit can't silently break WCAG AA.
const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = tokens(":root");
const dark = { ...light, ...tokens(':root[data-theme="dark"]') };

// [text token, background token] pairs actually used for body-size text.
const pairs: [string, string][] = [
  ["text-primary", "surface-canvas"],
  ["text-primary", "surface-default"],
  ["text-primary", "surface-sunken"],
  ["text-secondary", "surface-canvas"],
  ["text-secondary", "surface-default"],
  ["text-secondary", "surface-sunken"],
  ["text-link", "surface-canvas"],
  ["text-link", "surface-default"],
  ["text-link", "surface-primary-subtle"],
  ["text-on-primary", "action-primary"],
  ["text-on-primary", "action-primary-hover"],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme contrast", (_, theme) => {
  it.each(pairs)("%s on %s meets WCAG AA (4.5:1)", (fg, bg) => {
    expect(theme[fg], `missing token ${fg}`).toBeDefined();
    expect(theme[bg], `missing token ${bg}`).toBeDefined();
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
