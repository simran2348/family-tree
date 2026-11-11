// Pure functions that add a relative to a tree draft. They never mutate nested
// objects in place – new arrays/objects are assigned – so undo snapshots stay intact.
import { createPerson } from '../utils/person';
import { uid } from '../utils/id';
import {
  getParents, getBiologicalParents, validateRelationship, hasRelationship, getPartners,
} from '../utils/graph';

function addRel(draft, rel) {
  const full = { id: uid('r'), ...rel };
  const error = validateRelationship(draft, full);
  if (error) throw new Error(error);
  draft.relationships = [...draft.relationships, full];
  return full;
}

/**
 * opts: {
 *   kind: 'parent' | 'child' | 'partner' | 'sibling' | 'none',
 *   anchorId, existingId?, person? (fields for a new person),
 *   subtype?, status?, startDate?, otherParentId?, linkCoParent?, siblingParentIds?
 * }
 * Returns the id of the new/linked person. Throws an Error with a readable message on failure.
 */
export function addRelative(draft, opts) {
  const { kind, anchorId, existingId } = opts;
  let personId = existingId;
  if (kind !== 'none' && !draft.people[anchorId]) throw new Error('Select a person first.');

  if (!personId) {
    const p = createPerson(opts.person || {});
    draft.people = { ...draft.people, [p.id]: p };
    personId = p.id;
  } else if (!draft.people[personId]) {
    throw new Error('That person no longer exists.');
  }

  if (kind === 'parent') {
    const existingParents = getParents(draft, anchorId);
    addRel(draft, { type: 'parent', source: personId, target: anchorId, subtype: opts.subtype || 'biological' });
    if (opts.linkCoParent && existingParents.length === 1 && !hasRelationship(draft, existingParents[0], personId, 'partner')) {
      addRel(draft, { type: 'partner', source: existingParents[0], target: personId, status: 'married', startDate: '' });
    }
  } else if (kind === 'child') {
    addRel(draft, { type: 'parent', source: anchorId, target: personId, subtype: opts.subtype || 'biological' });
    if (opts.otherParentId && draft.people[opts.otherParentId]) {
      addRel(draft, { type: 'parent', source: opts.otherParentId, target: personId, subtype: opts.subtype || 'biological' });
    }
  } else if (kind === 'partner') {
    addRel(draft, { type: 'partner', source: anchorId, target: personId, status: opts.status || 'married', startDate: opts.startDate || '', endDate: opts.endDate || '' });
  } else if (kind === 'sibling') {
    let parentIds = opts.siblingParentIds?.length ? opts.siblingParentIds : getBiologicalParents(draft, anchorId);
    if (!parentIds.length) parentIds = getParents(draft, anchorId);
    if (!parentIds.length) {
      // Siblings are linked through shared parents, so create a placeholder parent.
      const placeholder = createPerson({ firstName: 'Unknown', lastName: draft.people[anchorId].lastName || '', isPlaceholder: true, shortBio: 'Placeholder parent created to link siblings.' });
      draft.people = { ...draft.people, [placeholder.id]: placeholder };
      addRel(draft, { type: 'parent', source: placeholder.id, target: anchorId, subtype: 'biological' });
      parentIds = [placeholder.id];
    }
    for (const parentId of parentIds) {
      addRel(draft, { type: 'parent', source: parentId, target: personId, subtype: opts.subtype || 'biological' });
    }
  }
  return personId;
}

export function removePerson(draft, id) {
  const people = { ...draft.people };
  delete people[id];
  draft.people = people;
  draft.relationships = draft.relationships.filter((r) => r.source !== id && r.target !== id);
  if (draft.positions[id]) {
    const positions = { ...draft.positions };
    delete positions[id];
    draft.positions = positions;
  }
  draft.collapsed = draft.collapsed.filter((c) => c !== id);
  if (draft.homePersonId === id) draft.homePersonId = Object.keys(people)[0] || null;
}

/** Suggests a free spot near the anchor for a new card when the tree is laid out manually. */
export function suggestPosition(draft, anchorId, kind, dims) {
  const anchor = draft.positions[anchorId];
  if (!anchor) return null;
  const { cardW, cardH, hSpacing, vSpacing, partnerSpacing } = dims;
  let pos;
  if (kind === 'parent') pos = { x: anchor.x + (getParents(draft, anchorId).length > 1 ? cardW / 2 : -cardW / 2), y: anchor.y - cardH - vSpacing };
  else if (kind === 'child') pos = { x: anchor.x, y: anchor.y + cardH + vSpacing };
  else if (kind === 'partner') pos = { x: anchor.x + (cardW + partnerSpacing) * (getPartners(draft, anchorId).length || 1), y: anchor.y };
  else pos = { x: anchor.x + cardW + hSpacing, y: anchor.y };
  const all = Object.values(draft.positions);
  const overlaps = (p) => all.some((q) => Math.abs(q.x - p.x) < cardW + 8 && Math.abs(q.y - p.y) < cardH + 8);
  let guard = 0;
  while (overlaps(pos) && guard++ < 200) pos = { ...pos, x: pos.x + cardW + hSpacing };
  return pos;
}

/** Normalises tree data from an import so every person/relationship has the expected shape. */
export function normalizeTree(raw, { keepId = false } = {}) {
  if (!raw || typeof raw !== 'object') throw new Error('This file does not contain a family tree.');
  const peopleIn = Array.isArray(raw.people) ? Object.fromEntries(raw.people.map((p) => [p.id, p])) : raw.people;
  if (!peopleIn || typeof peopleIn !== 'object') throw new Error('The family tree has no people list.');
  const people = {};
  for (const [id, p] of Object.entries(peopleIn)) {
    if (!p || typeof p !== 'object') continue;
    people[id] = createPerson({ ...p, id });
  }
  const relationships = (Array.isArray(raw.relationships) ? raw.relationships : [])
    .filter((r) => r && (r.type === 'parent' || r.type === 'partner') && people[r.source] && people[r.target] && r.source !== r.target)
    .map((r) => ({ ...r, id: r.id || uid('r') }));
  const now = new Date().toISOString();
  return {
    id: keepId && raw.id ? raw.id : uid('tree'),
    name: raw.name || 'Imported tree',
    description: raw.description || '',
    createdAt: raw.createdAt || now,
    updatedAt: now,
    homePersonId: people[raw.homePersonId] ? raw.homePersonId : Object.keys(people)[0] || null,
    people,
    relationships,
    positions: raw.positions && typeof raw.positions === 'object' ? raw.positions : {},
    layoutMode: raw.layoutMode === 'manual' ? 'manual' : 'auto',
    layoutPreset: raw.layoutPreset || 'vertical',
    collapsed: Array.isArray(raw.collapsed) ? raw.collapsed.filter((id) => people[id]) : [],
  };
}
