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
