import { ARTWORKS } from './artworks.js';

export const TIMELINE_YEARS = Array.from({ length: 11 }, (_, i) => 1940 + i);

// Werken uit het museum per jaar (het eerste jaartal in de datering telt).
export function worksInYear(year) {
  return ARTWORKS.filter((a) => a.status === 'periode' && Number((a.year.match(/\d{4}/) || [])[0]) === year);
}
