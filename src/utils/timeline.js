import { parseDate, dateSortKey } from './dates';
import { displayName, isDeceased } from './person';

/** Flattens births, deaths, partnerships and life events into a sorted list. */
export function buildTimeline(tree) {
  const events = [];
  for (const p of Object.values(tree.people)) {
    if (p.birthDate) events.push({ id: `b-${p.id}`, kind: 'birth', date: p.birthDate, personIds: [p.id], title: `${displayName(p)} was born`, place: p.birthPlace });
    if (p.deathDate) events.push({ id: `d-${p.id}`, kind: 'death', date: p.deathDate, personIds: [p.id], title: `${displayName(p)} died`, place: '' });
    for (const ev of p.events || []) {
      if (!ev.date && !ev.title) continue;
      events.push({ id: `e-${ev.id}`, kind: 'event', date: ev.date, personIds: [p.id], title: ev.title || 'Life event', description: ev.description, place: ev.place });
    }
  }
  for (const r of tree.relationships) {
    if (r.type !== 'partner' || !r.startDate) continue;
    const a = tree.people[r.source];
    const b = tree.people[r.target];
    if (!a || !b) continue;
    const verb = r.status === 'engaged' ? 'got engaged' : r.status === 'partner' ? 'became partners' : 'married';
    events.push({ id: `m-${r.id}`, kind: 'marriage', date: r.startDate, personIds: [a.id, b.id], title: `${displayName(a)} and ${displayName(b)} ${verb}` });
    if (r.endDate && (r.status === 'divorced' || r.status === 'separated'))
      events.push({ id: `x-${r.id}`, kind: 'separation', date: r.endDate, personIds: [a.id, b.id], title: `${displayName(a)} and ${displayName(b)} ${r.status}` });
  }
  return events.filter((e) => parseDate(e.date)).sort((a, b) => dateSortKey(a.date) - dateSortKey(b.date));
}

/** Birthdays, memorials and anniversaries in the next `days` days (needs month + day). */
export function upcomingAnniversaries(tree, days = 60, today = new Date()) {
  const out = [];
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const add = (date, item) => {
    const d = parseDate(date);
    if (!d?.month || !d?.day) return;
    let next = new Date(start.getFullYear(), d.month - 1, d.day);
    if (next < start) next = new Date(start.getFullYear() + 1, d.month - 1, d.day);
    const inDays = Math.round((next - start) / 86400000);
    if (inDays > days) return;
    out.push({ ...item, next, inDays, years: next.getFullYear() - d.year });
  };
  for (const p of Object.values(tree.people)) {
    if (p.birthDate && !isDeceased(p)) add(p.birthDate, { id: `b-${p.id}`, kind: 'birthday', personIds: [p.id], title: `${displayName(p)}’s birthday` });
    if (p.birthDate && isDeceased(p)) add(p.birthDate, { id: `bm-${p.id}`, kind: 'remembrance', personIds: [p.id], title: `${displayName(p)} was born` });
    if (p.deathDate) add(p.deathDate, { id: `d-${p.id}`, kind: 'remembrance', personIds: [p.id], title: `Remembering ${displayName(p)}` });
  }
  for (const r of tree.relationships) {
    if (r.type !== 'partner' || !r.startDate || r.status === 'divorced' || r.status === 'separated') continue;
    const a = tree.people[r.source];
    const b = tree.people[r.target];
    if (a && b) add(r.startDate, { id: `m-${r.id}`, kind: 'anniversary', personIds: [a.id, b.id], title: `${displayName(a)} & ${displayName(b)} anniversary` });
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}
