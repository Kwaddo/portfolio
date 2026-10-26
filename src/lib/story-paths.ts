import { getCollection } from 'astro:content';
import { journeyChapters, published } from './content';
import { forProject, newestFirst, toDevlog } from './journal';
import { nextStory, sortTimeline } from './timeline';

export async function storyPaths() {
  const [timeline, chapters, journal, games, lab] = await Promise.all([
    getCollection('timeline'),
    getCollection('journeys'),
    getCollection('journal'),
    getCollection('games'),
    getCollection('lab'),
  ]);
  const sorted = sortTimeline(published(timeline));
  const live = published(chapters);
  const posts = newestFirst(published(journal));

  return sorted
    .filter((e) => e.data.journey)
    .map((entry) => {
      if ([...games, ...lab].some((g) => g.id === entry.id)) {
        throw new Error(
          `timeline/${entry.id} has journey: true but "${entry.id}" is also a game/lab id; journey chapters would render on two routes. Rename the timeline entry.`,
        );
      }
      const own = journeyChapters(live, entry.id);
      if (own.length === 0) {
        throw new Error(`timeline/${entry.id} has journey: true but no chapters in src/content/journeys/${entry.id}/`);
      }
      const next = nextStory(sorted, entry.id);
      return {
        params: { slug: entry.id },
        props: {
          title: entry.data.org ?? entry.data.title,
          chapters: own,
          devlog: toDevlog(forProject(posts, entry.id)),
          next: next ? { title: next.data.org ?? next.data.title, href: `/about/${next.id}/` } : undefined,
        },
      };
    });
}
