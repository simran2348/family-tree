import { getYear, ageBetween, dateSortKey } from './dates';
import { isDeceased } from './person';
import { getParents, getChildren } from './graph';

export function computeStats(tree) {
  const people = Object.values(tree.people);
  const gender = { male: 0, female: 0, other: 0, unknown: 0 };
  let living = 0;
  let deceased = 0;
  const lifespans = [];
  const surnames = new Map();
  const places = new Map();
  for (const p of people) {
    gender[p.gender in gender ? p.gender : 'unknown'] += 1;
    if (isDeceased(p)) deceased += 1; else living += 1;
    if (p.birthDate && p.deathDate) {
      const a = ageBetween(p.birthDate, p.deathDate);
      if (a !== null) lifespans.push({ id: p.id, age: a });
    }
    const s = (p.birthSurname || p.lastName || '').trim();
    if (s) surnames.set(s, (surnames.get(s) || 0) + 1);
    const pl = (p.birthPlace || '').split(',').pop().trim();
    if (pl) places.set(pl, (places.get(pl) || 0) + 1);
  }
  const withBirth = people.filter((p) => getYear(p.birthDate));
  const byBirth = [...withBirth].sort((a, b) => dateSortKey(a.birthDate) - dateSortKey(b.birthDate));
  const livingWithBirth = byBirth.filter((p) => !isDeceased(p));

  return {
    total: people.length,
    generations: countGenerations(tree),
    gender,
    living,
    deceased,
    oldestEver: byBirth[0] || null,
    youngest: byBirth[byBirth.length - 1] || null,
    oldestLiving: livingWithBirth[0] || null,
    longestLived: [...lifespans].sort((a, b) => b.age - a.age)[0] || null,
    averageLifespan: lifespans.length ? Math.round(lifespans.reduce((s, l) => s + l.age, 0) / lifespans.length) : null,
    partnerships: tree.relationships.filter((r) => r.type === 'partner').length,
    surnames: [...surnames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    places: [...places.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    earliestYear: getYear(byBirth[0]?.birthDate),
    photos: people.filter((p) => p.photo?.src).length,
  };
}

function countGenerations(tree) {
  const memo = new Map();
  const depth = (id, stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return 1;
    stack.add(id);
    const kids = getChildren(tree, id);
    const d = 1 + (kids.length ? Math.max(...kids.map((k) => depth(k, stack))) : 0);
    stack.delete(id);
    memo.set(id, d);
    return d;
  };
  let max = 0;
  for (const id of Object.keys(tree.people)) {
    if (getParents(tree, id).length) continue;
    max = Math.max(max, depth(id));
  }
  return max;
}
