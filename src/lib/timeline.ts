export const monthLabel = (ym: string): string => {
  const [year, month] = ym.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const periodLabel = (start: string, end: string): string =>
  end === 'present' ? `${monthLabel(start)} - present` : `${monthLabel(start)} - ${monthLabel(end)}`;

export const sortTimeline = <T extends { data: { start: string; end: string } }>(entries: T[]): T[] =>
  [...entries].sort((a, b) => {
    const aNow = a.data.end === 'present';
    const bNow = b.data.end === 'present';
    if (aNow !== bNow) return aNow ? -1 : 1;
    if (a.data.end !== b.data.end) return a.data.end < b.data.end ? 1 : -1;
    return a.data.start < b.data.start ? 1 : a.data.start > b.data.start ? -1 : 0;
  });

export const nextStory = <T extends { id: string; data: { journey: boolean } }>(
  sorted: T[],
  id: string,
): T | undefined => {
  const list = sorted.filter((x) => x.data.journey);
  const i = list.findIndex((x) => x.id === id);
  return i === -1 ? undefined : list[i + 1];
};
