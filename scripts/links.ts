const clean = (value: string): string => value.split('#')[0].split('?')[0];
const isInternal = (value: string): boolean => value.startsWith('/') && !value.startsWith('//');

export function extractTargets(html: string): string[] {
  const out: string[] = [];
  for (const [, , value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (isInternal(value)) out.push(clean(value));
  }
  for (const [, value] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const candidate of value.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (isInternal(url)) out.push(clean(url));
    }
  }
  return out;
}

export function distPathFor(target: string): string[] {
  const path = target.replace(/^\//, '');
  if (path === '' || path.endsWith('/')) return [`${path}index.html`];
  const last = path.split('/').pop() ?? '';
  return last.includes('.') ? [path] : [path, `${path}/index.html`];
}

export function sameDocFragments(html: string): string[] {
  return [...html.matchAll(/\shref="#([^"]+)"/g)].map((m) => m[1]);
}

export function hasId(html: string, id: string): boolean {
  return new RegExp(`\\sid="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html);
}
