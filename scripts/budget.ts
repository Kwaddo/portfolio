export const BUDGET_BYTES = 200_000;

const internal = (v: string): boolean => v.startsWith('/') && !v.startsWith('//');

const attr = (tag: string, name: string): string | undefined => tag.match(new RegExp(`\\s${name}="([^"]+)"`))?.[1];

export function assetPaths(html: string): { css: string[]; js: string[] } {
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]).filter((t) => /\srel="stylesheet"/.test(t));
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  const pick = (tags: string[], name: string) =>
    tags.map((t) => attr(t, name)).filter((v): v is string => v !== undefined && internal(v));
  return { css: pick(links, 'href'), js: pick(scripts, 'src') };
}

export function fontUrls(css: string): string[] {
  return [...css.matchAll(/url\(\s*["']?([^"')\s]+?\.woff2)(?:\?[^"')\s]*)?["']?\s*\)/g)].map((m) => m[1]);
}

export const isLatinFont = (url: string): boolean => /-latin-(?:wght|\d+)-normal/.test(url);
