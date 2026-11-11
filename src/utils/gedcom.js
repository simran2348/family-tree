// Minimal GEDCOM 5.5 import/export covering individuals, families, names, sex,
// birth/death dates and places, occupation, notes and parent/partner links.
import { createPerson } from './person';
import { uid } from './id';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function gedDateToIso(raw) {
  if (!raw) return '';
  const s = raw.toUpperCase().replace(/^(ABT|ABOUT|EST|CAL|BEF|AFT|CIRCA|C\.)\s+/, '').trim();
  const m = s.match(/^(?:(\d{1,2})\s+)?(?:([A-Z]{3})\s+)?(\d{3,4})$/);
  if (!m) {
    const y = s.match(/(\d{4})/);
    return y ? y[1] : '';
  }
  const [, day, mon, year] = m;
  const mi = mon ? MONTHS.indexOf(mon) + 1 : 0;
  if (!mi) return year;
  const pad = (n) => String(n).padStart(2, '0');
  return day ? `${year}-${pad(mi)}-${pad(day)}` : `${year}-${pad(mi)}`;
}

function isoToGedDate(iso) {
  const m = (iso || '').match(/^(\d{1,4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!m) return '';
  const [, y, mo, d] = m;
  return [d ? Number(d) : null, mo ? MONTHS[Number(mo) - 1] : null, y].filter(Boolean).join(' ');
}

function parseLines(text) {
  const root = { children: [] };
  const stack = [{ level: -1, node: root }];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^﻿/, '').trim();
    if (!line) continue;
    const m = line.match(/^(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s(.*))?$/);
    if (!m) continue;
    const level = Number(m[1]);
    const node = { pointer: m[2]?.trim() || null, tag: m[3], value: m[4] ?? '', children: [] };
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ level, node });
  }
  return root.children;
}

const child = (node, tag) => node.children.find((c) => c.tag === tag);
const children = (node, tag) => node.children.filter((c) => c.tag === tag);
const textOf = (node) => {
  if (!node) return '';
  let s = node.value || '';
  for (const c of node.children) {
    if (c.tag === 'CONT') s += `\n${c.value || ''}`;
    if (c.tag === 'CONC') s += c.value || '';
  }
  return s;
};

export function parseGedcom(text, treeName = 'Imported tree') {
  const records = parseLines(text);
  if (!records.some((r) => r.tag === 'INDI')) throw new Error('No individuals (INDI records) found in this GEDCOM file.');
  const people = {};
  const ptrToId = new Map();
  const relationships = [];

  for (const rec of records.filter((r) => r.tag === 'INDI')) {
    const nameNode = child(rec, 'NAME');
    const nameVal = nameNode?.value || '';
    const surnameMatch = nameVal.match(/\/([^/]*)\//);
    const given = (child(nameNode || { children: [] }, 'GIVN')?.value || nameVal.replace(/\/[^/]*\//, '')).trim();
    const surname = (child(nameNode || { children: [] }, 'SURN')?.value || surnameMatch?.[1] || '').trim();
    const [firstName, ...middle] = given.split(/\s+/).filter(Boolean);
    const sex = child(rec, 'SEX')?.value?.trim().toUpperCase();
    const birt = child(rec, 'BIRT');
    const deat = child(rec, 'DEAT');
    const resi = child(rec, 'RESI');
    const p = createPerson({
      firstName: firstName || '',
      middleName: middle.join(' '),
      lastName: surname,
      birthSurname: surname,
      gender: sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'unknown',
      birthDate: gedDateToIso(child(birt || { children: [] }, 'DATE')?.value),
      birthPlace: child(birt || { children: [] }, 'PLAC')?.value || '',
      deathDate: gedDateToIso(child(deat || { children: [] }, 'DATE')?.value),
      isLiving: !deat,
      location: child(resi || { children: [] }, 'PLAC')?.value || '',
      occupation: child(rec, 'OCCU')?.value || '',
      education: child(rec, 'EDUC')?.value || '',
      nationality: child(rec, 'NATI')?.value || '',
      notes: children(rec, 'NOTE').map(textOf).filter((n) => !n.startsWith('@')).join('\n\n'),
    });
    people[p.id] = p;
    if (rec.pointer) ptrToId.set(rec.pointer, p.id);
  }

  for (const fam of records.filter((r) => r.tag === 'FAM')) {
    const husb = ptrToId.get(child(fam, 'HUSB')?.value?.trim());
    const wife = ptrToId.get(child(fam, 'WIFE')?.value?.trim());
    const marr = child(fam, 'MARR');
    const div = child(fam, 'DIV');
    if (husb && wife) {
      relationships.push({
        id: uid('r'), type: 'partner', source: husb, target: wife,
        status: div ? 'divorced' : marr ? 'married' : 'partner',
        startDate: gedDateToIso(child(marr || { children: [] }, 'DATE')?.value),
        endDate: gedDateToIso(child(div || { children: [] }, 'DATE')?.value),
      });
    }
    for (const c of children(fam, 'CHIL')) {
      const cid = ptrToId.get(c.value.trim());
      if (!cid) continue;
      const pedi = (child(c, '_FREL')?.value || child(c, 'PEDI')?.value || '').toLowerCase();
      const subtype = pedi.includes('adop') ? 'adoptive' : pedi.includes('step') ? 'step' : pedi.includes('foster') ? 'foster' : 'biological';
      for (const parent of [husb, wife].filter(Boolean)) {
        relationships.push({ id: uid('r'), type: 'parent', source: parent, target: cid, subtype });
      }
    }
  }
  return { name: treeName, people, relationships };
}

export function exportGedcom(tree) {
  const lines = ['0 HEAD', '1 SOUR FamilyTreeBuilder', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8'];
  const ptr = new Map();
  Object.keys(tree.people).forEach((id, i) => ptr.set(id, `@I${i + 1}@`));

  // Families: one per partnership, plus one per lone parent / unpartnered parent pair.
  const families = [];
  const famKey = (a, b) => [a, b].filter(Boolean).sort().join('|');
  const famByKey = new Map();
  const ensureFam = (a, b, rel) => {
    const key = famKey(a, b);
    if (!famByKey.has(key)) {
      const f = { id: `@F${families.length + 1}@`, parents: [a, b].filter(Boolean), children: [], rel };
      famByKey.set(key, f);
      families.push(f);
    }
    return famByKey.get(key);
  };
  for (const r of tree.relationships) if (r.type === 'partner') ensureFam(r.source, r.target, r);
  const parentsOf = new Map();
  for (const r of tree.relationships) {
    if (r.type !== 'parent') continue;
    if (!parentsOf.has(r.target)) parentsOf.set(r.target, []);
    parentsOf.get(r.target).push(r);
  }
  for (const [childId, rels] of parentsOf) {
    const [a, b] = rels.map((r) => r.source);
    const f = ensureFam(a, b);
    f.children.push({ id: childId, subtype: rels[0].subtype });
  }

  for (const p of Object.values(tree.people)) {
    lines.push(`0 ${ptr.get(p.id)} INDI`);
    const given = [p.firstName, p.middleName].filter(Boolean).join(' ');
    lines.push(`1 NAME ${given} /${p.birthSurname || p.lastName || ''}/`);
    if (given) lines.push(`2 GIVN ${given}`);
    if (p.lastName) lines.push(`2 SURN ${p.lastName}`);
    lines.push(`1 SEX ${p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'U'}`);
    if (p.birthDate || p.birthPlace) {
      lines.push('1 BIRT');
      if (p.birthDate) lines.push(`2 DATE ${isoToGedDate(p.birthDate)}`);
      if (p.birthPlace) lines.push(`2 PLAC ${p.birthPlace}`);
    }
    if (p.deathDate || p.isLiving === false) {
      lines.push('1 DEAT');
      if (p.deathDate) lines.push(`2 DATE ${isoToGedDate(p.deathDate)}`);
    }
    if (p.occupation) lines.push(`1 OCCU ${p.occupation}`);
    if (p.education) lines.push(`1 EDUC ${p.education}`);
    if (p.nationality) lines.push(`1 NATI ${p.nationality}`);
    if (p.location) lines.push('1 RESI', `2 PLAC ${p.location}`);
    if (p.notes) {
      const [first, ...rest] = p.notes.split('\n');
      lines.push(`1 NOTE ${first}`);
      rest.forEach((l) => lines.push(`2 CONT ${l}`));
    }
    for (const f of families) {
      if (f.parents.includes(p.id)) lines.push(`1 FAMS ${f.id}`);
      if (f.children.some((c) => c.id === p.id)) lines.push(`1 FAMC ${f.id}`);
    }
  }
  for (const f of families) {
    lines.push(`0 ${f.id} FAM`);
    const [a, b] = f.parents;
    const pa = tree.people[a];
    const husbFirst = !pa || pa.gender !== 'female';
    const husb = husbFirst ? a : b;
    const wife = husbFirst ? b : a;
    if (husb) lines.push(`1 HUSB ${ptr.get(husb)}`);
    if (wife) lines.push(`1 WIFE ${ptr.get(wife)}`);
    if (f.rel && (f.rel.status === 'married' || f.rel.status === 'divorced' || f.rel.startDate)) {
      lines.push('1 MARR');
      if (f.rel.startDate) lines.push(`2 DATE ${isoToGedDate(f.rel.startDate)}`);
    }
    if (f.rel?.status === 'divorced') {
      lines.push('1 DIV');
      if (f.rel.endDate) lines.push(`2 DATE ${isoToGedDate(f.rel.endDate)}`);
    }
    for (const c of f.children) {
      lines.push(`1 CHIL ${ptr.get(c.id)}`);
      if (c.subtype && c.subtype !== 'biological') lines.push(`2 PEDI ${c.subtype === 'adoptive' ? 'adopted' : c.subtype}`);
    }
  }
  lines.push('0 TRLR');
  return lines.join('\n');
}
