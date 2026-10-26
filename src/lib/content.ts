type Draftable = { data: { draft: boolean } };
type Ordered = { data: { order: number } };

export const published = <T extends Draftable>(entries: T[]): T[] => entries.filter((e) => !e.data.draft);

export const byOrder = <T extends Ordered>(entries: T[]): T[] =>
  [...entries].sort((a, b) => a.data.order - b.data.order);

export const journeyChapters = <T extends { data: { order: number; project: string } }>(
  entries: T[],
  project: string,
): T[] => byOrder(entries.filter((e) => e.data.project === project));

export type JourneyRef = { kind: 'games' | 'lab'; id: string; title: string; journey: boolean };

export const nextJourney = (refs: JourneyRef[], kind: JourneyRef['kind'], id: string): JourneyRef | undefined => {
  const list = refs.filter((r) => r.journey);
  const i = list.findIndex((r) => r.kind === kind && r.id === id);
  return i === -1 ? undefined : list[i + 1];
};

export const nextProject = (refs: JourneyRef[], kind: JourneyRef['kind'], id: string): JourneyRef | undefined => {
  const same = refs.filter((r) => r.kind === kind);
  const i = same.findIndex((r) => r.id === id);
  if (i === -1) return undefined;
  if (i + 1 < same.length) return same[i + 1];
  return refs.find((r) => r.kind !== kind);
};

/** Prose classes for a markdown body with a drop cap; narrow openers (I, J, L, 1) get a wider box so they frame like an S. */
export const dropcap = (body: string | undefined): string =>
  /^[IJL1]/.test((body ?? '').trimStart()) ? 'prose dropcap dropcap--narrow' : 'prose dropcap';
