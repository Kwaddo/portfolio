import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { formatDay } from '../lib/dates';
import { excerpt, newestFirst } from '../lib/journal';
import { published } from '../lib/content';

export async function GET(context: APIContext) {
  const entries = newestFirst(published(await getCollection('journal')));
  return rss({
    title: `${site.name}: journal`,
    description: 'Short daily notes: what is being built, learned and played.',
    site: context.site!,
    items: entries.map((e) => ({
      title: formatDay(e.data.date),
      description: excerpt(e.body ?? '', 280),
      pubDate: e.data.date,
      link: `/journal/${e.id}/`,
    })),
  });
}
