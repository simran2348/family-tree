// Relationship graph helpers. Relationships are stored as a flat list:
//   { id, type: 'parent', source: parentId, target: childId, subtype }
//   { id, type: 'partner', source: personA, target: personB, status, startDate, endDate }
// Every kinship term (grandparent, cousin, in-law…) is derived from these two edge types.
import { dateSortKey } from './dates';

const cache = new WeakMap();

export function indexTree(tree) {
  if (!tree) return { parentsOf: new Map(), childrenOf: new Map(), partnersOf: new Map() };
  const hit = cache.get(tree.relationships);
  if (hit) return hit;
  const parentsOf = new Map();
  const childrenOf = new Map();
  const partnersOf = new Map();
  const push = (map, key, val) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(val);
  };
  for (const rel of tree.relationships) {
    if (!tree.people[rel.source] || !tree.people[rel.target]) continue;
    if (rel.type === 'parent') {
      push(parentsOf, rel.target, { id: rel.source, rel });
      push(childrenOf, rel.source, { id: rel.target, rel });
    } else if (rel.type === 'partner') {
      push(partnersOf, rel.source, { id: rel.target, rel });
      push(partnersOf, rel.target, { id: rel.source, rel });
    }
  }
  const idx = { parentsOf, childrenOf, partnersOf };
  cache.set(tree.relationships, idx);
  return idx;
}

export const getParentLinks = (tree, id) => indexTree(tree).parentsOf.get(id) || [];
export const getChildLinks = (tree, id) => indexTree(tree).childrenOf.get(id) || [];
export const getPartnerLinks = (tree, id) => indexTree(tree).partnersOf.get(id) || [];

export const getParents = (tree, id) => getParentLinks(tree, id).map((l) => l.id);
export const getPartners = (tree, id) => getPartnerLinks(tree, id).map((l) => l.id);

export function getChildren(tree, id) {
  const ids = getChildLinks(tree, id).map((l) => l.id);
  return sortByBirth(tree, ids);
}

export function sortByBirth(tree, ids) {
  return [...ids].sort((a, b) => {
    const da = dateSortKey(tree.people[a]?.birthDate);
    const db = dateSortKey(tree.people[b]?.birthDate);
    if (da !== db) return da - db;
    return (tree.people[a]?.createdAt || '').localeCompare(tree.people[b]?.createdAt || '');
  });
}

export function getBiologicalParents(tree, id) {
  return getParentLinks(tree, id)
    .filter((l) => !l.rel.subtype || l.rel.subtype === 'biological')
    .map((l) => l.id);
}

export function getSiblings(tree, id) {
  const parents = getParents(tree, id);
  const counts = new Map();
  for (const p of parents) {
    for (const c of getChildren(tree, p)) {
      if (c === id) continue;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  const full = [];
  const half = [];
  for (const [sib, n] of counts) {
    if (parents.length > 1 && n >= Math.min(2, parents.length)) full.push(sib);
    else if (parents.length === 1) full.push(sib);
    else half.push(sib);
  }
  return { full: sortByBirth(tree, full), half: sortByBirth(tree, half), all: sortByBirth(tree, [...full, ...half]) };
}

export function getAncestors(tree, id, maxDepth = Infinity) {
  const out = new Map(); // id -> depth
  const walk = (pid, depth) => {
    if (depth > maxDepth) return;
    for (const parent of getParents(tree, pid)) {
      if (out.has(parent) && out.get(parent) <= depth) continue;
      out.set(parent, depth);
      walk(parent, depth + 1);
    }
  };
  walk(id, 1);
  return out;
}

export function getDescendants(tree, id) {
  const out = new Map();
  const walk = (pid, depth) => {
    for (const child of getChildren(tree, pid)) {
      if (out.has(child) && out.get(child) <= depth) continue;
      out.set(child, depth);
      walk(child, depth + 1);
    }
  };
  walk(id, 1);
  return out;
}

export function hasRelationship(tree, a, b, type) {
  return tree.relationships.some(
    (r) =>
      r.type === type &&
      ((r.source === a && r.target === b) || (type === 'partner' && r.source === b && r.target === a)),
  );
}

/** Returns a human readable error, or null when the relationship is valid. */
export function validateRelationship(tree, rel) {
  const { type, source, target } = rel;
  if (!tree.people[source] || !tree.people[target]) return 'Both people must exist in this tree.';
  if (source === target) return 'A person cannot be related to themselves.';

  if (type === 'parent') {
    if (hasRelationship(tree, source, target, 'parent')) return 'This parent link already exists.';
    if (hasRelationship(tree, target, source, 'parent')) return 'That person is already their child.';
    if (getDescendants(tree, target).has(source))
      return 'That would make someone their own ancestor.';
    if (hasRelationship(tree, source, target, 'partner')) return 'Partners cannot also be parent and child.';
    const subtype = rel.subtype || 'biological';
    if (subtype === 'biological' && getBiologicalParents(tree, target).length >= 2)
      return 'This person already has two biological parents. Choose adoptive, step or foster instead.';
  }

  if (type === 'partner') {
    if (hasRelationship(tree, source, target, 'partner')) return 'These two are already partners.';
    if (getAncestors(tree, source).has(target) || getDescendants(tree, source).has(target))
      return 'A person cannot partner with their own ancestor or descendant.';
  }
  return null;
}

export function getCoParent(tree, childId, parentId) {
  return getParents(tree, childId).find((p) => p !== parentId) || null;
}

/** All people connected to `id` through any relationship. */
export function getConnectedComponent(tree, id) {
  const seen = new Set([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    const next = [...getParents(tree, cur), ...getChildren(tree, cur), ...getPartners(tree, cur)];
    for (const n of next) if (!seen.has(n)) { seen.add(n); stack.push(n); }
  }
  return seen;
}
