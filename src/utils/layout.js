// Automatic family-tree layout.
//
// People are grouped into "units" (a person plus their partners in the same generation).
// Each unit is assigned to one parent unit, giving a forest that is laid out with a
// simple tidy-tree algorithm: children are placed side by side and their parents are
// centred above them. The result is then rotated for horizontal layouts.
import {
  getParents, getChildren, getPartners, getAncestors, getDescendants, getPartnerLinks,
} from './graph';
import { dateSortKey } from './dates';

export const isHorizontalPreset = (preset) => preset === 'horizontal' || preset === 'pedigree';

export function getEffectiveDimensions(layout, preset) {
  const compact = preset === 'compact';
  return {
    cardW: Math.round(layout.cardWidth * (compact ? 0.84 : 1)),
    cardH: Math.round(layout.cardHeight * (compact ? 0.86 : 1)),
    hSpacing: layout.hSpacing * (compact ? 0.45 : 1),
    vSpacing: layout.vSpacing * (compact ? 0.6 : 1),
    partnerSpacing: Math.max(layout.partnerSpacing * (compact ? 0.7 : 1), 18),
    branchSpacing: layout.branchSpacing * (compact ? 0.45 : 1),
  };
}

/** Which people should be on the canvas for the given preset / collapsed branches / filter. */
export function getVisibleIds(tree, { preset, focusId, collapsed = [], filter = null }) {
  const all = Object.keys(tree.people);
  let visible;
  const focus = tree.people[focusId] ? focusId : tree.homePersonId && tree.people[tree.homePersonId] ? tree.homePersonId : all[0];

  if (preset === 'descendants' && focus) {
    visible = new Set([focus, ...getDescendants(tree, focus).keys()]);
    for (const id of [...visible]) for (const p of getPartners(tree, id)) visible.add(p);
  } else if ((preset === 'ancestors' || preset === 'pedigree') && focus) {
    visible = new Set([focus, ...getAncestors(tree, focus).keys()]);
  } else {
    visible = new Set(all);
  }

  // Collapsed branches hide every descendant (and partners who only connect through them).
  const hidden = new Set();
  for (const cid of collapsed) {
    if (!visible.has(cid)) continue;
    for (const d of getDescendants(tree, cid).keys()) hidden.add(d);
  }
  for (const h of [...hidden]) {
    for (const p of getPartners(tree, h)) {
      if (hidden.has(p) || collapsed.includes(p)) continue;
      const otherPartnersHidden = getPartners(tree, p).every((x) => hidden.has(x));
      const hasVisibleParents = getParents(tree, p).some((x) => visible.has(x) && !hidden.has(x));
      if (otherPartnersHidden && !hasVisibleParents) hidden.add(p);
    }
  }
  for (const h of hidden) visible.delete(h);

  if (filter) visible = new Set([...visible].filter((id) => filter.has(id)));
  return visible;
}

export function computeLayout(tree, { preset, focusId, visible, layout }) {
  const dims = getEffectiveDimensions(layout, preset);
  const horizontal = isHorizontalPreset(preset);
  const breadth = horizontal ? dims.cardH : dims.cardW;
  const depthStep = (horizontal ? dims.cardW : dims.cardH) + dims.vSpacing;

  const raw = (preset === 'ancestors' || preset === 'pedigree')
    ? ancestorLayout(tree, { focusId, visible, breadth, dims })
    : generationalLayout(tree, { visible, breadth, dims, balanced: preset === 'balanced', alignLeft: layout.alignment === 'left' });

  const positions = new Map();
  for (const [id, { b, depth }] of raw) {
    let d = depth * depthStep;
    if (preset === 'ancestors') d = -d;
    positions.set(id, horizontal ? { x: d, y: b } : { x: b, y: d });
  }
  return { positions, axis: horizontal ? 'horizontal' : 'vertical', cardW: dims.cardW, cardH: dims.cardH };
}

// ---------------------------------------------------------------------------

function assignGenerations(tree, visible) {
  const gen = new Map();
  const ids = [...visible].sort((a, b) => (tree.people[a].createdAt || '').localeCompare(tree.people[b].createdAt || ''));
  for (const start of ids) {
    if (gen.has(start)) continue;
    const component = [start];
    gen.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      const g = gen.get(cur);
      const edges = [
        ...getParents(tree, cur).map((id) => [id, g - 1]),
        ...getChildren(tree, cur).map((id) => [id, g + 1]),
        ...getPartners(tree, cur).map((id) => [id, g]),
      ];
      for (const [id, ng] of edges) {
        if (!visible.has(id) || gen.has(id)) continue;
        gen.set(id, ng);
        component.push(id);
        queue.push(id);
      }
    }
    const min = Math.min(...component.map((id) => gen.get(id)));
    for (const id of component) gen.set(id, gen.get(id) - min);
  }
  return gen;
}

function buildUnits(tree, visible, gen) {
  const unitOf = new Map();
  const units = [];
  for (const id of visible) {
    if (unitOf.has(id)) continue;
    const unit = { id: `u${units.length}`, members: [], gen: gen.get(id), kids: [] };
    const stack = [id];
    unitOf.set(id, unit);
    while (stack.length) {
      const cur = stack.pop();
      unit.members.push(cur);
      for (const p of getPartners(tree, cur)) {
        if (!visible.has(p) || unitOf.has(p) || gen.get(p) !== unit.gen) continue;
        unitOf.set(p, unit);
        stack.push(p);
      }
    }
    units.push(unit);
  }
  return { units, unitOf };
}

function generationalLayout(tree, { visible, breadth, dims, balanced, alignLeft }) {
  const gen = assignGenerations(tree, visible);
  const { units, unitOf } = buildUnits(tree, visible, gen);
  const visibleParents = (id) => getParents(tree, id).filter((p) => visible.has(p));
  const birthKey = (id) => dateSortKey(tree.people[id]?.birthDate);

  const childUnitsOf = (unit) => {
    const kids = [];
    for (const m of unit.members) for (const c of getChildren(tree, m)) if (visible.has(c)) kids.push(c);
    const ordered = [...new Set(kids)].sort((a, b) => birthKey(a) - birthKey(b));
    const out = [];
    for (const c of ordered) {
      const u = unitOf.get(c);
      if (u && !out.includes(u)) out.push(u);
    }
    return out;
  };

  // 1. Ownership: every unit hangs beneath exactly one parent unit.
  const visited = new Set();
  const hasOutsideParents = (unit, owner) =>
    unit.members.some((m) => visibleParents(m).length && !visibleParents(m).some((p) => owner.members.includes(p)));
  const own = (unit) => {
    visited.add(unit);
    const kids = childUnitsOf(unit);
    const ordered = [...kids.filter((k) => !hasOutsideParents(k, unit)), ...kids.filter((k) => hasOutsideParents(k, unit))];
    for (const child of ordered) {
      if (visited.has(child) || child.gen !== unit.gen + 1) continue;
      child.owner = unit;
      unit.kids.push(child);
      own(child);
    }
  };
  const rootOrder = (a, b) =>
    a.gen - b.gen ||
    (tree.people[a.members[0]].createdAt || '').localeCompare(tree.people[b.members[0]].createdAt || '');
  const roots = [];
  const isRoot = (u) => u.members.every((m) => visibleParents(m).length === 0);
  for (const u of units.filter(isRoot).sort(rootOrder)) {
    if (visited.has(u)) continue;
    roots.push(u);
    own(u);
  }
  for (const u of [...units].sort(rootOrder)) {
    if (visited.has(u)) continue;
    roots.push(u);
    own(u);
  }

  // 2. Member order inside a unit: blood relative first, extra partners around a hub.
  for (const u of units) u.members = orderMembers(tree, u, visibleParents);

  // 3. Measure subtree widths.
  const unitWidth = (u) => u.members.length * breadth + (u.members.length - 1) * dims.partnerSpacing;
  const gapBetween = (a, b) => (a.kids.length || b.kids.length ? dims.branchSpacing : dims.hSpacing);
  const measure = (u) => {
    u.kids.forEach(measure);
    const slot = balanced && u.kids.length ? Math.max(...u.kids.map((k) => k.sw)) : 0;
    let kidsW = 0;
    u.kids.forEach((k, i) => {
      kidsW += balanced ? slot : k.sw;
      if (i > 0) kidsW += gapBetween(u.kids[i - 1], k);
    });
    u.kidsW = kidsW;
    u.slot = slot;
    u.sw = Math.max(unitWidth(u), kidsW);
  };
  roots.forEach(measure);

  // 4. Place.
  const raw = new Map();
  const place = (u, left) => {
    let cursor = left + (u.sw - u.kidsW) / 2;
    u.kids.forEach((k, i) => {
      if (i > 0) cursor += gapBetween(u.kids[i - 1], k);
      const w = balanced ? u.slot : k.sw;
      place(k, cursor + (w - k.sw) / 2);
      cursor += w;
    });
    const w = unitWidth(u);
    let unitLeft;
    const bloodKids = u.kids.flatMap((k) => k.members.filter((m) => visibleParents(m).some((p) => u.members.includes(p))));
    if (bloodKids.length) {
      const centers = bloodKids.map((id) => raw.get(id).b + breadth / 2);
      const center = alignLeft ? Math.min(...centers) : (Math.min(...centers) + Math.max(...centers)) / 2;
      unitLeft = alignLeft ? center - breadth / 2 : center - w / 2;
    } else {
      unitLeft = alignLeft ? left : left + (u.sw - w) / 2;
    }
    unitLeft = Math.max(left, Math.min(unitLeft, left + u.sw - w));
    u.members.forEach((m, i) => raw.set(m, { b: unitLeft + i * (breadth + dims.partnerSpacing), depth: u.gen }));
  };
  let cursor = 0;
  roots.forEach((r, i) => {
    if (i > 0) cursor += dims.branchSpacing * 1.5;
    place(r, cursor);
    cursor += r.sw;
  });

  // 5. Roots whose children were laid out under another family (e.g. in-law grandparents)
  //    slide toward the middle of all their children if that space is free.
  for (const r of roots) {
    const kids = [...new Set(r.members.flatMap((m) => getChildren(tree, m)))].filter((c) => raw.has(c));
    if (!kids.length) continue;
    const centers = kids.map((id) => raw.get(id).b + breadth / 2);
    const w = unitWidth(r);
    const currentLeft = raw.get(r.members[0]).b;
    const desiredLeft = (Math.min(...centers) + Math.max(...centers)) / 2 - w / 2;
    if (Math.abs(desiredLeft - currentLeft) < 1) continue;
    const others = [...raw.entries()]
      .filter(([id, p]) => p.depth === r.gen && !r.members.includes(id))
      .map(([, p]) => [p.b - dims.hSpacing, p.b + breadth + dims.hSpacing]);
    const fits = (left) => others.every(([a, b]) => left + w <= a || left >= b);
    // Walk from the desired spot back toward the current one and take the first free slot.
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const left = desiredLeft + ((currentLeft - desiredLeft) * i) / steps;
      if (fits(left)) {
        r.members.forEach((m, j) => raw.set(m, { b: left + j * (breadth + dims.partnerSpacing), depth: r.gen }));
        break;
      }
    }
  }
  return raw;
}

function orderMembers(tree, unit, visibleParents) {
  const m = unit.members;
  if (m.length === 1) return m;
  const ownerMembers = unit.owner ? unit.owner.members : [];
  const isBlood = (id) => visibleParents(id).some((p) => ownerMembers.includes(p));
  const genderRank = (id) => (tree.people[id].gender === 'male' ? 0 : tree.people[id].gender === 'female' ? 1 : 2);

  if (m.length === 2) {
    const [a, b] = m;
    if (isBlood(a) && !isBlood(b)) return [a, b];
    if (isBlood(b) && !isBlood(a)) return [b, a];
    return [...m].sort((x, y) => genderRank(x) - genderRank(y));
  }
  // Hub with several partners: first partner left, hub, remaining partners right.
  const inUnit = new Set(m);
  const hub = [...m].sort(
    (a, b) => getPartners(tree, b).filter((x) => inUnit.has(x)).length - getPartners(tree, a).filter((x) => inUnit.has(x)).length,
  )[0];
  const partners = getPartnerLinks(tree, hub)
    .filter((l) => inUnit.has(l.id))
    .sort((a, b) => dateSortKey(a.rel.startDate) - dateSortKey(b.rel.startDate))
    .map((l) => l.id);
  const rest = m.filter((x) => x !== hub && !partners.includes(x));
  return [partners[0], hub, ...partners.slice(1), ...rest].filter(Boolean);
}

function ancestorLayout(tree, { focusId, visible, breadth, dims }) {
  const raw = new Map();
  const seen = new Set();
  const genderRank = (id) => (tree.people[id].gender === 'male' ? 0 : tree.people[id].gender === 'female' ? 1 : 2);
  const place = (pid, left, depth) => {
    seen.add(pid);
    const parents = getParents(tree, pid)
      .filter((p) => visible.has(p) && !seen.has(p))
      .sort((a, b) => genderRank(a) - genderRank(b));
    if (!parents.length) {
      raw.set(pid, { b: left, depth });
      return breadth;
    }
    let cursor = left;
    parents.forEach((p, i) => {
      if (i > 0) cursor += dims.hSpacing;
      cursor += place(p, cursor, depth + 1);
    });
    const total = cursor - left;
    const centers = parents.map((p) => raw.get(p).b + breadth / 2);
    const center = (Math.min(...centers) + Math.max(...centers)) / 2;
    raw.set(pid, { b: center - breadth / 2, depth });
    return Math.max(total, breadth);
  };
  const focus = visible.has(focusId) ? focusId : [...visible][0];
  if (focus) place(focus, 0, 0);
  // Anything unreachable (should be rare) goes in a row beneath.
  let extra = 0;
  for (const id of visible) {
    if (raw.has(id)) continue;
    raw.set(id, { b: extra, depth: -1 });
    extra += breadth + dims.hSpacing;
  }
  return raw;
}
