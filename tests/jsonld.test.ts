import { describe, expect, test } from 'vitest';
import { jsonLdScript, personLd } from '../src/lib/jsonld';
import { site } from '../src/data/site';

describe('personLd', () => {
  const ld = personLd();
  test('is a schema.org Person with the public identity', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Ali Khalaf');
    expect(ld.jobTitle).toBe('Software Engineer');
  });
  test('links to the profiles in site data', () => {
    expect(ld.sameAs).toEqual([site.links.github, site.links.linkedin]);
  });
  test('never contains an email or phone number', () => {
    const text = JSON.stringify(ld);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}|mailto|telephone|"email"/i);
    expect(text).not.toMatch(/\b(?:\+?973[\s-]?)?3\d{3}[\s-]?\d{4}\b/);
  });
});

describe('jsonLdScript', () => {
  test('escapes < so the payload cannot close the script tag', () => {
    expect(jsonLdScript({ a: '</script><b>' })).not.toContain('<');
    expect(JSON.parse(jsonLdScript({ a: '</script>' })).a).toBe('</script>');
  });
});
