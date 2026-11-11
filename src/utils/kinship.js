// Derives a kinship term ("Grandmother", "First cousin once removed", "Sister-in-law")
// for `targetId` as seen from `fromId`, using only parent and partner edges.
import {
  getAncestors, getParentLinks, getPartners, getParents, getChildren,
} from './graph';

const g = (person, male, female, neutral) =>
  person?.gender === 'male' ? male : person?.gender === 'female' ? female : neutral;

const ordinal = (n) => ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'][n] || `${n}th`;
const removed = (n) => (n === 1 ? 'once removed' : n === 2 ? 'twice removed' : `${n} times removed`);

function greats(n) {
  if (n <= 0) return '';
  if (n === 1) return 'Great-';
  if (n === 2) return 'Great-great-';
  return `${n}× great-`;
}

function bloodTerm(tree, fromId, targetId) {
  const target = tree.people[targetId];
  const up = getAncestors(tree, fromId);
  up.set(fromId, 0);
  const upT = getAncestors(tree, targetId);
  upT.set(targetId, 0);

  let best = null;
  for (const [anc, da] of up) {
    if (!upT.has(anc)) continue;
    const db = upT.get(anc);
    if (!best || da + db < best.da + best.db) best = { anc, da, db };
  }
  if (!best) return null;
  const { da, db } = best;

  if (da === 0 && db === 0) return 'Self';
  if (db === 0) {
    // target is an ancestor
    if (da === 1) {
      const link = getParentLinks(tree, fromId).find((l) => l.id === targetId);
      const sub = link?.rel?.subtype;
      const base = g(target, 'Father', 'Mother', 'Parent');
      if (sub === 'adoptive') return `Adoptive ${base.toLowerCase()}`;
      if (sub === 'step') return `Step-${base.toLowerCase()}`;
      if (sub === 'foster') return `Foster ${base.toLowerCase()}`;
      return base;
    }
    const base = g(target, 'Grandfather', 'Grandmother', 'Grandparent');
    return da === 2 ? base : `${greats(da - 2)}${base.toLowerCase()}`;
  }
  if (da === 0) {
    if (db === 1) {
      const link = getParentLinks(tree, targetId).find((l) => l.id === fromId);
      const sub = link?.rel?.subtype;
      const base = g(target, 'Son', 'Daughter', 'Child');
      if (sub === 'adoptive') return `Adopted ${base.toLowerCase()}`;
      if (sub === 'step') return `Step${base.toLowerCase()}`;
      if (sub === 'foster') return `Foster ${base.toLowerCase()}`;
      return base;
    }
    const base = g(target, 'Grandson', 'Granddaughter', 'Grandchild');
    return db === 2 ? base : `${greats(db - 2)}${base.toLowerCase()}`;
  }
  if (da === 1 && db === 1) {
    const shared = getParents(tree, fromId).filter((p) => getParents(tree, targetId).includes(p));
    const both = getParents(tree, fromId).length > 1 && shared.length < 2;
    const base = g(target, 'Brother', 'Sister', 'Sibling');
    return both ? `Half-${base.toLowerCase()}` : base;
  }
  if (db === 1) {
    // target is sibling of an ancestor → aunt/uncle
    const base = g(target, 'Uncle', 'Aunt', 'Parent’s sibling');
    if (da === 2) return base;
    return `${greats(da - 2)}${base.toLowerCase()}`;
  }
  if (da === 1) {
    const base = g(target, 'Nephew', 'Niece', 'Sibling’s child');
    if (db === 2) return base;
    return `${greats(db - 2)}${base.toLowerCase()}`;
  }
  const degree = Math.min(da, db) - 1;
  const rem = Math.abs(da - db);
  return `${ordinal(degree)} cousin${rem ? ` ${removed(rem)}` : ''}`;
}

export function getRelationshipLabel(tree, fromId, targetId) {
  if (!tree || !fromId || !targetId || !tree.people[fromId] || !tree.people[targetId]) return '';
  if (fromId === targetId) return 'Self';
  const target = tree.people[targetId];

  const partnerLink = getPartners(tree, fromId).includes(targetId)
    ? tree.relationships.find(
        (r) => r.type === 'partner' &&
          ((r.source === fromId && r.target === targetId) || (r.source === targetId && r.target === fromId)),
      )
    : null;
  if (partnerLink) {
    const status = partnerLink.status;
    if (status === 'divorced') return g(target, 'Ex-husband', 'Ex-wife', 'Ex-partner');
    if (status === 'married') return g(target, 'Husband', 'Wife', 'Spouse');
    if (status === 'engaged') return g(target, 'Fiancé', 'Fiancée', 'Fiancé(e)');
    return 'Partner';
  }

  const blood = bloodTerm(tree, fromId, targetId);
  if (blood) return blood;

  // Step relations: partner of a parent / child of a partner.
  const parents = getParents(tree, fromId);
  if (parents.some((p) => getPartners(tree, p).includes(targetId)))
    return g(target, 'Stepfather', 'Stepmother', 'Step-parent');
  if (getPartners(tree, fromId).some((p) => getChildren(tree, p).includes(targetId)))
    return g(target, 'Stepson', 'Stepdaughter', 'Stepchild');

  // In-laws: partner's blood relatives, or blood relatives' partners.
  for (const partner of getPartners(tree, fromId)) {
    const t = bloodTerm(tree, partner, targetId);
    if (t && t !== 'Self') return inLaw(t);
  }
  for (const spouse of getPartners(tree, targetId)) {
    const t = bloodTerm(tree, fromId, spouse);
    if (t && t !== 'Self') {
      if (/^(Son|Daughter|Child)$/.test(t)) return g(target, 'Son-in-law', 'Daughter-in-law', 'Child-in-law');
      if (/^(Brother|Sister|Sibling|Half-)/.test(t)) return g(target, 'Brother-in-law', 'Sister-in-law', 'Sibling-in-law');
      if (/(Uncle|Aunt)/.test(t)) return g(target, 'Uncle by marriage', 'Aunt by marriage', 'Relative by marriage');
      return 'Relative by marriage';
    }
  }
  return 'Relative';
}

function inLaw(term) {
  if (/^(Father|Mother|Parent)$/.test(term)) return `${term}-in-law`;
  if (/^(Brother|Sister|Sibling)$/.test(term)) return `${term}-in-law`;
  if (/^(Son|Daughter|Child)$/.test(term)) return `Step${term.toLowerCase()}`;
  return `${term} (by marriage)`;
}
