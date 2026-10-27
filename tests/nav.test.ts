import { describe, expect, test } from 'vitest';
import { chapterOf, isActive, nav } from '../src/lib/nav';

describe('nav', () => {
  test('lists the five primary pages in order', () => {
    expect(nav.map((n) => n.label)).toEqual(['Work', 'Personal', 'Journal', 'About', 'Contact']);
  });
  test('matches nested paths', () => {
    expect(isActive('/work/tanami/', '/work/')).toBe(true);
  });
  test('does not match siblings that share a prefix', () => {
    expect(isActive('/workshop/', '/work/')).toBe(false);
  });
  test('the root only matches itself', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/about/', '/')).toBe(false);
  });
  test('numbers each primary page as a chapter, in nav order', () => {
    expect(chapterOf('/work/')).toBe(1);
    expect(chapterOf('/contact/')).toBe(5);
  });
  test('other pages are not chapters', () => {
    expect(chapterOf('/')).toBeUndefined();
    expect(chapterOf('/work/tanami/')).toBeUndefined();
  });
});
