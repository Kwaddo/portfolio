export const nav = [
  { href: '/work/', label: 'Work' },
  { href: '/personal/', label: 'Personal' },
  { href: '/journal/', label: 'Journal' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const isActive = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href);

/** A primary page's chapter number: its place in the nav, from 1. Any other path is not a chapter. */
export const chapterOf = (pathname: string): number | undefined => {
  const i = nav.findIndex((n) => n.href === pathname);
  return i === -1 ? undefined : i + 1;
};
