import { describe, expect, test } from 'vitest';
import { monthLabel, nextStory, periodLabel, sortTimeline } from '../src/lib/timeline';

const e = (id: string, start: string, end: string, journey = false) => ({ id, data: { start, end, journey } });

describe('labels', () => {
  test('monthLabel formats YYYY-MM', () => {
    expect(monthLabel('2026-06')).toBe('Jun 2026');
    expect(monthLabel('2025-09')).toBe('Sep 2025');
  });
  test('periodLabel handles present and closed periods', () => {
    expect(periodLabel('2026-06', 'present')).toBe('Jun 2026 - present');
    expect(periodLabel('2025-06', '2025-07')).toBe('Jun 2025 - Jul 2025');
  });
});

describe('sortTimeline', () => {
  test('pins current entries on top, then end date descending, then start descending', () => {
    const input = [
      e('doo', '2025-06', '2025-07'),
      e('tanami', '2026-06', 'present'),
      e('croozz', '2025-02', '2026-01'),
      e('uob', '2021-09', '2026-08'),
      e('reboot', '2024-08', '2026-08'),
    ];
    expect(sortTimeline(input).map((x) => x.id)).toEqual(['tanami', 'reboot', 'uob', 'croozz', 'doo']);
  });
  test('does not mutate its input', () => {
    const input = [e('a', '2020-01', '2020-02'), e('b', '2021-01', '2021-02')];
    sortTimeline(input);
    expect(input.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('nextStory', () => {
  const sorted = [e('a', '2026-01', 'present', true), e('b', '2025-01', '2025-02'), e('c', '2024-01', '2024-02', true)];
  test('returns the next entry that has a journey', () => {
    expect(nextStory(sorted, 'a')?.id).toBe('c');
  });
  test('returns undefined at the end or for unknown ids', () => {
    expect(nextStory(sorted, 'c')).toBeUndefined();
    expect(nextStory(sorted, 'zzz')).toBeUndefined();
  });
});
