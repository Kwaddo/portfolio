import { site } from '../src/data/site.ts';
import { toAddress } from '../src/lib/email.ts';

// Terms that must not appear on the site (stored encoded so the source stays clean).
const TERMS = 'Y2xhdWRlfGFudGhyb3BpY3xjb3BpbG90fGNoYXRncHR8b3BlbmFpfHN1cGVycG93ZXJzfGFpWy0gXWFzc2lzdGVkfHZpYmVbLSBdY29kfGNvLWF1dGhvcmVk';
const AI_TOOLING = new RegExp(Buffer.from(TERMS, 'base64').toString(), 'i');
const EMAIL = new RegExp(toAddress(site.emailParts).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const FORBIDDEN: { name: string; re: RegExp; markupOnly?: boolean }[] = [
  { name: 'AI tooling name', re: AI_TOOLING },
  { name: 'phone number', re: /\b(?:\+?973[\s-]?)?3\d{3}[\s-]?\d{4}\b/ },
  { name: 'plain email address', re: EMAIL },
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
  let visible = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '').replace(ATTRS, '');
  // The one allowed appearance of the handle as text: the decorative, aria-hidden KWADDO word in the landing hero, and only there.
  if (path === 'index.html') visible = visible.replace(/<span class="sfx[^"]*" aria-hidden="true"[^>]*><span>KWADDO<\/span><\/span>/g, '');
  // Sitemap and RSS legitimately carry the site URL in these elements and attributes.
  if (path.endsWith('.xml')) visible = visible.replace(/<(loc|link|guid)\b[^>]*>[\s\S]*?<\/\1>/g, '').replace(/\s(?:href|url)="[^"]*"/g, '');
  if (/kwaddo/i.test(visible)) out.push(`${path}: Kwaddo handle shown as text`);
  if (path.startsWith('work/tanami/') && /<(img|picture|video|iframe)\b/i.test(html)) {
    out.push(`${path}: media on confidential page`);
  }
  return out;
}

export function ogImageOf(html: string): string | undefined {
  const match = html.match(/<meta property="og:image" content="([^"]+)"/);
  return match ? new URL(match[1]).pathname : undefined;
}
