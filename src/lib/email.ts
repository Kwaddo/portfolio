export type EmailParts = { user: string; domain: string };

export const toAddress = (p: EmailParts): string => `${p.user}@${p.domain}`;

export const toSpelledOut = (p: EmailParts): string =>
  `${p.user} [at] ${p.domain.replaceAll('.', ' [dot] ')}`;
