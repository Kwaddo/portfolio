import { getCollection } from 'astro:content';
import { forProject, newestFirst, toDevlog } from './journal';
import { byOrder, journeyChapters, nextJourney, published, type JourneyRef } from './content';

export async function journeyPaths(kind: 'games' | 'lab') {
  const [games, lab, chapters, journal] = await Promise.all([
    getCollection('games'),
    getCollection('lab'),
    getCollection('journeys'),
    getCollection('journal'),
  ]);
  const refs: JourneyRef[] = [
    ...byOrder(published(games)).map((e) => ({ kind: 'games' as const, id: e.id, title: e.data.title, journey: e.data.journey })),
    ...byOrder(published(lab)).map((e) => ({ kind: 'lab' as const, id: e.id, title: e.data.title, journey: e.data.journey })),
  ];
  const live = published(chapters);
  const posts = newestFirst(published(journal));

  return refs
    .filter((r) => r.kind === kind && r.journey)
    .map((ref) => {
      const own = journeyChapters(live, ref.id);
      if (own.length === 0) {
        throw new Error(`${kind}/${ref.id} has journey: true but no chapters in src/content/journeys/${ref.id}/`);
      }
      const next = nextJourney(refs, kind, ref.id);
      return {
        params: { slug: ref.id },
        props: {
          title: ref.title,
          chapters: own,
          devlog: toDevlog(forProject(posts, ref.id)),
          next: next ? { title: next.title, href: `/personal/${next.kind}/${next.id}/journey/` } : undefined,
        },
      };
    });
}
