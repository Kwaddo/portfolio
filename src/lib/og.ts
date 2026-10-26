const SECTIONS = ['work', 'personal', 'journal', 'about'] as const;

export const ogImageFor = (pathname: string): string => {
  const section = SECTIONS.find((s) => pathname === `/${s}/` || pathname.startsWith(`/${s}/`));
  return `/og/${section ?? 'landing'}.png`;
};
