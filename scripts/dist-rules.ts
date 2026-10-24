const FORBIDDEN: { name: string; re: RegExp; markupOnly?: boolean }[] = [
  { name: 'AI tooling name', re: /claude|anthropic|copilot|chatgpt|openai|superpowers|ai[- ]assisted|vibe[- ]cod|co-authored/i },
  { name: 'phone number', re: /36000253/ },
  { name: 'plain email address', re: /alimohsen999@gmail\.com/i },
  { name: 'mailto link', re: /mailto:/i, markupOnly: true },
  { name: 'Quad shown', re: /\bQuad\b/ },
];

const ATTRS = /\s(?:href|src|content|data-src|srcset|action)="[^"]*"/g;

export function findViolations(path: string, html: string): string[] {
  const out: string[] = [];
  // Astro inlines small scripts; the copy-email script legitimately contains the text "mailto:".
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const { name, re, markupOnly } of FORBIDDEN) {
    if (re.test(markupOnly ? markup : html)) out.push(`${path}: ${name}`);
  }
  if (/kwaddo/i.test(html.replace(ATTRS, ''))) out.push(`${path}: Kwaddo handle shown as text`);
  if (path.startsWith('work/tanami/') && /<(img|picture|video|iframe)\b/i.test(html)) {
    out.push(`${path}: media on confidential page`);
  }
  return out;
}
