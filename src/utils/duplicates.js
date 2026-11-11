import { getYear } from './dates';

const norm = (s) => (s || '').trim().toLowerCase();

/** People that look like the same individual as `candidate` (same name, compatible birth year). */
export function findPossibleDuplicates(tree, candidate, excludeId = null) {
  const first = norm(candidate.firstName);
  const last = norm(candidate.lastName);
  if (!first) return [];
  const year = getYear(candidate.birthDate);
  return Object.values(tree.people).filter((p) => {
    if (p.id === excludeId) return false;
    if (norm(p.firstName) !== first) return false;
    if (last && norm(p.lastName) && norm(p.lastName) !== last && norm(p.birthSurname) !== last) return false;
    const py = getYear(p.birthDate);
    if (year && py && Math.abs(year - py) > 1) return false;
    return true;
  });
}

/** Pairs of people across the whole tree that may be duplicates. */
export function findDuplicatePairs(tree) {
  const people = Object.values(tree.people);
  const pairs = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i];
      const b = people[j];
      if (!norm(a.firstName) || norm(a.firstName) !== norm(b.firstName)) continue;
      if (norm(a.lastName) !== norm(b.lastName)) continue;
      const ya = getYear(a.birthDate);
      const yb = getYear(b.birthDate);
      if (ya && yb && Math.abs(ya - yb) > 1) continue;
      pairs.push([a.id, b.id]);
    }
  }
  return pairs;
}
