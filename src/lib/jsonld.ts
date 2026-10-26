import { site } from '../data/site';

export const personLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  jobTitle: site.role,
  url: site.url,
  sameAs: [site.links.github, site.links.linkedin],
  address: { '@type': 'PostalAddress', addressCountry: 'BH' },
});

export const jsonLdScript = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
