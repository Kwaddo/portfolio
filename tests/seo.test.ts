import { describe, expect, test } from 'vitest';
import { canonical, pageTitle } from '../src/lib/seo';

describe('seo', () => {
  test('home title carries name and role', () => {
    expect(pageTitle()).toBe('Ali Khalaf, Software Engineer');
  });
  test('inner pages append the name', () => {
    expect(pageTitle('Work')).toBe('Work | Ali Khalaf');
  });
  test('canonical resolves against the site url', () => {
    expect(canonical('/work/')).toBe('https://alikhalaf.fn.dilmune.app/work/');
  });
});
