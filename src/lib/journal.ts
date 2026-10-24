export const stripMarkdown = (md: string): string =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/(^|\s)[*_~]{1,3}(?=\S)|(?<=\S)[*_~]{1,3}(?=\s|$|[.,;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

export const excerpt = (md: string, max = 180): string => {
  const text = stripMarkdown(md);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  if (text[max] === ' ') return `${cut}…`;
  const at = cut.lastIndexOf(' ');
  return `${(at === -1 ? cut : cut.slice(0, at)).trimEnd()}…`;
};

export const firstSentence = (md: string): string => {
  const text = stripMarkdown(md);
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : excerpt(text, 160);
};

export const newestFirst = <T extends { id: string; data: { date: Date } }>(entries: T[]): T[] =>
  [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || (a.id < b.id ? 1 : -1));

export const tagsOf = (entries: { data: { tags: string[] } }[]): string[] =>
  [...new Set(entries.flatMap((e) => e.data.tags))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

export const tagSlug = (tag: string): string =>
  tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const neighbors = <T extends { id: string }>(
  newestFirstList: T[],
  id: string,
): { newer?: T; older?: T } => {
  const i = newestFirstList.findIndex((e) => e.id === id);
  if (i === -1) return {};
  return { newer: newestFirstList[i - 1], older: newestFirstList[i + 1] };
};

export const postFilename = (existing: string[], iso: string): string => {
  const taken = new Set(existing);
  if (!taken.has(`${iso}.md`)) return `${iso}.md`;
  let n = 2;
  while (taken.has(`${iso}-${n}.md`)) n += 1;
  return `${iso}-${n}.md`;
};

export const forProject = <T extends { data: { project?: string } }>(entries: T[], slug: string): T[] =>
  entries.filter((e) => e.data.project === slug);

export type DevlogItem = { href: string; date: Date; text: string };

export const toDevlog = (entries: { id: string; body?: string; data: { date: Date } }[]): DevlogItem[] =>
  entries.map((e) => ({ href: `/journal/${e.id}/`, date: e.data.date, text: excerpt(e.body ?? '', 140) }));
