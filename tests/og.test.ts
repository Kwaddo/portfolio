import { describe, expect, test } from 'vitest';
import { ogImageFor } from '../src/lib/og';

describe('ogImageFor', () => {
  test('uses the landing card for the root and unlisted pages', () => {
    expect(ogImageFor('/')).toBe('/og/landing.png');
    expect(ogImageFor('/contact/')).toBe('/og/landing.png');
    expect(ogImageFor('/resume/')).toBe('/og/landing.png');
  });
  test('maps each section to its card, including nested pages', () => {
    expect(ogImageFor('/work/')).toBe('/og/work.png');
    expect(ogImageFor('/work/tanami/')).toBe('/og/work.png');
    expect(ogImageFor('/personal/games/smobb/')).toBe('/og/personal.png');
    expect(ogImageFor('/journal/2026-10-24/')).toBe('/og/journal.png');
    expect(ogImageFor('/about/croozz/')).toBe('/og/about.png');
  });
  test('does not match siblings that share a prefix', () => {
    expect(ogImageFor('/workshop/')).toBe('/og/landing.png');
  });
});
