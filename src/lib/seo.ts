import { site } from '../data/site';

export const pageTitle = (title?: string): string =>
  title ? `${title} | ${site.name}` : `${site.name}, ${site.role}`;

export const canonical = (pathname: string): string => new URL(pathname, site.url).href;
