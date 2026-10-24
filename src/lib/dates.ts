export const formatMonth = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
