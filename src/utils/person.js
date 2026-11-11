import { uid } from './id';
import { getYear, ageBetween } from './dates';

export function createPerson(fields = {}) {
  const now = new Date().toISOString();
  return {
    id: uid('p'),
    firstName: '',
    middleName: '',
    lastName: '',
    birthSurname: '',
    gender: 'unknown',
    birthDate: '',
    deathDate: '',
    isLiving: true,
    birthPlace: '',
    location: '',
    nationality: '',
    relationshipStatus: '',
    photo: null, // { src, x, y, zoom }
    gallery: [], // [{ id, src, caption }]
    shortBio: '',
    lifeStory: '',
    education: '',
    occupation: '',
    events: [], // [{ id, date, title, description }]
    notes: '',
    customFields: [], // [{ id, label, value }]
    isPlaceholder: false,
    createdAt: now,
    updatedAt: now,
    ...fields,
  };
}

export const fullName = (p) =>
  p ? [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ').trim() || 'Unnamed' : '';

export const displayName = (p) =>
  p ? [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || 'Unnamed' : '';

export const initials = (p) => {
  if (!p) return '?';
  const s = `${(p.firstName || '').charAt(0)}${(p.lastName || '').charAt(0)}`.toUpperCase();
  return s || '?';
};

export const isDeceased = (p) => Boolean(p?.deathDate) || p?.isLiving === false;

export function lifespan(p) {
  const b = getYear(p?.birthDate);
  const d = getYear(p?.deathDate);
  if (!b && !d) return isDeceased(p) ? 'Deceased' : '';
  if (isDeceased(p)) return `${b ?? '?'} – ${d ?? '?'}`;
  return `b. ${b}`;
}

export function ageLabel(p) {
  const age = ageBetween(p?.birthDate, p?.deathDate || null);
  if (age === null) return '';
  return isDeceased(p) ? `aged ${age}` : `${age} years`;
}
