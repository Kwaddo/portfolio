import { describe, expect, test } from 'vitest';
import {
  excerpt,
  firstSentence,
  forProject,
  neighbors,
  newestFirst,
  postFilename,
  stripMarkdown,
  tagSlug,
  tagsOf,
  toDevlog,
} from '../src/lib/journal';

const post = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  body: `Body of ${id}. More text.`,
  data: { date: new Date(date), tags: [] as string[], project: undefined as string | undefined, ...extra },
});

describe('stripMarkdown', () => {
  test('removes headings, emphasis, links, images and code', () => {
    const md = '# Title\n\nSome **bold** and _italic_ with a [link](https://x.dev) and `code`.\n\n![alt](a.png)\n\n```js\nconst a = 1;\n```';
    expect(stripMarkdown(md)).toBe('Title Some bold and italic with a link and code.');
  });
});

describe('excerpt', () => {
  test('returns short text untouched', () => {
    expect(excerpt('Short one.')).toBe('Short one.');
  });
  test('cuts at a word boundary and adds an ellipsis', () => {
    const out = excerpt('alpha beta gamma delta epsilon', 14);
    expect(out).toBe('alpha beta…');
  });
});

describe('firstSentence', () => {
  test('returns the first sentence', () => {
    expect(firstSentence('Hello world. Second one.')).toBe('Hello world.');
  });
  test('falls back to an excerpt when there is no terminator', () => {
    expect(firstSentence('no terminator here')).toBe('no terminator here');
  });
});

describe('ordering and navigation', () => {
  const a = post('2026-10-01', '2026-10-01');
  const b = post('2026-10-02', '2026-10-02');
  const c = post('2026-10-03', '2026-10-03');
  test('newestFirst sorts descending without mutating', () => {
    const input = [a, c, b];
    expect(newestFirst(input).map((p) => p.id)).toEqual(['2026-10-03', '2026-10-02', '2026-10-01']);
    expect(input.map((p) => p.id)).toEqual(['2026-10-01', '2026-10-03', '2026-10-02']);
  });
  test('neighbors returns newer and older', () => {
    const sorted = newestFirst([a, b, c]);
    expect(neighbors(sorted, '2026-10-02')).toEqual({ newer: c, older: a });
    expect(neighbors(sorted, '2026-10-03')).toEqual({ newer: undefined, older: b });
    expect(neighbors(sorted, 'nope')).toEqual({});
  });
});

describe('tags', () => {
  test('tagsOf is unique and sorted', () => {
    const list = [post('a', '2026-10-01', { tags: ['go', 'rust'] }), post('b', '2026-10-02', { tags: ['go'] })];
    expect(tagsOf(list)).toEqual(['go', 'rust']);
  });
  test('tagSlug is url-safe', () => {
    expect(tagSlug('Game Dev!')).toBe('game-dev');
    expect(tagSlug('  C# / .NET ')).toBe('c-net');
  });
});

describe('postFilename', () => {
  test('uses the plain date when free', () => {
    expect(postFilename([], '2026-10-25')).toBe('2026-10-25.md');
  });
  test('adds -2, -3 when taken', () => {
    expect(postFilename(['2026-10-25.md'], '2026-10-25')).toBe('2026-10-25-2.md');
    expect(postFilename(['2026-10-25.md', '2026-10-25-2.md'], '2026-10-25')).toBe('2026-10-25-3.md');
  });
});

describe('project devlog', () => {
  test('forProject filters by project slug', () => {
    const list = [post('a', '2026-10-01', { project: 'smobb' }), post('b', '2026-10-02', { project: 'skoobl' }), post('c', '2026-10-03')];
    expect(forProject(list, 'smobb').map((p) => p.id)).toEqual(['a']);
  });
  test('toDevlog maps entries to links with an excerpt', () => {
    const items = toDevlog([post('2026-10-02', '2026-10-02')]);
    expect(items).toEqual([{ href: '/journal/2026-10-02/', date: new Date('2026-10-02'), text: 'Body of 2026-10-02. More text.' }]);
  });
});

describe('polish', () => {
  test('excerpt cuts a spaceless token at max', () => {
    expect(excerpt('x'.repeat(200), 20)).toBe(`${'x'.repeat(20)}…`);
  });
  test('excerpt keeps the last word on an exact boundary', () => {
    expect(excerpt('alpha beta gamma', 10)).toBe('alpha beta…');
  });
  test('stripMarkdown keeps in-word underscores and code asterisks', () => {
    expect(stripMarkdown('use snake_case and `a*b` here')).toBe('use snake_case and a*b here');
  });
  test('stripMarkdown removes word-boundary emphasis', () => {
    expect(stripMarkdown('*bold* and _italic_ and **x**.')).toBe('bold and italic and x.');
  });
  test('newestFirst breaks date ties by id descending', () => {
    const x = post('2026-10-25', '2026-10-25');
    const y = post('2026-10-25-2', '2026-10-25');
    expect(newestFirst([x, y]).map((p) => p.id)).toEqual(['2026-10-25-2', '2026-10-25']);
  });
  test('tagsOf sorts case-insensitively', () => {
    expect(tagsOf([{ data: { tags: ['Rust', 'go'] } }])).toEqual(['go', 'Rust']);
  });
});
