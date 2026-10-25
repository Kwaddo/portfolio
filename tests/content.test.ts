import { describe, expect, test } from 'vitest';
import { byOrder, journeyChapters, nextJourney, nextProject, published, type JourneyRef } from '../src/lib/content';

const e = (id: string, data: Record<string, unknown>) => ({ id, data });

describe('published', () => {
  test('drops drafts and keeps the rest in order', () => {
    const list = [e('a', { draft: false }), e('b', { draft: true }), e('c', { draft: false })];
    expect(published(list as never[]).map((x: { id: string }) => x.id)).toEqual(['a', 'c']);
  });
});

describe('byOrder', () => {
  test('sorts ascending without mutating the input', () => {
    const list = [e('b', { order: 2 }), e('a', { order: 1 })];
    const sorted = byOrder(list as never[]) as { id: string }[];
    expect(sorted.map((x) => x.id)).toEqual(['a', 'b']);
    expect(list.map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('journeyChapters', () => {
  test('keeps only the project and orders by chapter', () => {
    const list = [
      e('x/02', { project: 'x', order: 2 }),
      e('y/01', { project: 'y', order: 1 }),
      e('x/01', { project: 'x', order: 1 }),
    ];
    expect((journeyChapters(list as never[], 'x') as { id: string }[]).map((c) => c.id)).toEqual(['x/01', 'x/02']);
  });
});

describe('nextJourney', () => {
  const refs: JourneyRef[] = [
    { kind: 'games', id: 'a', title: 'A', journey: true },
    { kind: 'games', id: 'b', title: 'B', journey: false },
    { kind: 'lab', id: 'c', title: 'C', journey: true },
  ];
  test('skips entries without a journey', () => {
    expect(nextJourney(refs, 'games', 'a')?.id).toBe('c');
  });
  test('returns undefined at the end', () => {
    expect(nextJourney(refs, 'lab', 'c')).toBeUndefined();
  });
  test('returns undefined for an unknown id', () => {
    expect(nextJourney(refs, 'games', 'nope')).toBeUndefined();
  });
});

describe('nextProject', () => {
  const refs: JourneyRef[] = [
    { kind: 'games', id: 'a', title: 'A', journey: false },
    { kind: 'games', id: 'b', title: 'B', journey: false },
    { kind: 'lab', id: 'c', title: 'C', journey: false },
  ];
  test('returns the next entry of the same kind', () => {
    expect(nextProject(refs, 'games', 'a')?.id).toBe('b');
  });
  test('wraps to the first entry of the other kind at the end of a list', () => {
    expect(nextProject(refs, 'games', 'b')?.id).toBe('c');
    expect(nextProject(refs, 'lab', 'c')?.id).toBe('a');
  });
  test('returns undefined for an unknown id', () => {
    expect(nextProject(refs, 'games', 'zzz')).toBeUndefined();
  });
});
