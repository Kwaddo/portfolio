import { describe, expect, test } from 'vitest';
import { formatMonth } from '../src/lib/dates';

describe('formatMonth', () => {
  test('formats as short month and year in UTC', () => {
    expect(formatMonth(new Date('2026-07-02'))).toBe('Jul 2026');
    expect(formatMonth(new Date('2026-09-01'))).toBe('Sep 2026');
  });
  test('does not shift across a month boundary', () => {
    expect(formatMonth(new Date('2026-10-01T00:00:00Z'))).toBe('Oct 2026');
  });
});
