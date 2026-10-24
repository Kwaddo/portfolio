export const nav = [
  { href: '/work/', label: 'Work' },
  { href: '/personal/', label: 'Personal' },
  { href: '/journal/', label: 'Journal' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const isActive = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href);
