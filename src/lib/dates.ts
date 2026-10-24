export const formatMonth = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatDay = (d: Date): string =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
