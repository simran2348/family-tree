// Dates are stored as partial ISO strings: "YYYY", "YYYY-MM" or "YYYY-MM-DD".
// Genealogical records are often incomplete, so every helper accepts partials.
const DATE_RE = /^(\d{1,4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/;

export function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const m = value.trim().match(DATE_RE);
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  if (month && (month < 1 || month > 12)) return null;
  if (day && (day < 1 || day > 31)) return null;
  return { year, month, day };
}

export const isValidDate = (value) => !value || parseDate(value) !== null;

export const getYear = (value) => parseDate(value)?.year ?? null;

export function dateSortKey(value) {
  const d = parseDate(value);
  if (!d) return Number.POSITIVE_INFINITY;
  return d.year * 10000 + (d.month || 0) * 100 + (d.day || 0);
}

const pad = (n) => String(n).padStart(2, '0');

export function formatDate(value, format = 'D MMM YYYY', locale = 'en-GB') {
  const d = parseDate(value);
  if (!d) return value || '';
  if (!d.month) return String(d.year);
  const date = new Date(Date.UTC(d.year, d.month - 1, d.day || 1));
  const monthShort = date.toLocaleString(locale, { month: 'short', timeZone: 'UTC' });
  const monthLong = date.toLocaleString(locale, { month: 'long', timeZone: 'UTC' });
  if (!d.day) {
    if (format.startsWith('YYYY')) return `${d.year}-${pad(d.month)}`;
    if (format.includes('/')) return `${pad(d.month)}/${d.year}`;
    return `${format.includes('MMMM') ? monthLong : monthShort} ${d.year}`;
  }
  switch (format) {
    case 'MMM D, YYYY':
      return `${monthShort} ${d.day}, ${d.year}`;
    case 'DD/MM/YYYY':
      return `${pad(d.day)}/${pad(d.month)}/${d.year}`;
    case 'MM/DD/YYYY':
      return `${pad(d.month)}/${pad(d.day)}/${d.year}`;
    case 'YYYY-MM-DD':
      return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
    case 'D MMMM YYYY':
      return `${d.day} ${monthLong} ${d.year}`;
    default:
      return `${d.day} ${monthShort} ${d.year}`;
  }
}

export function ageBetween(from, to) {
  const a = parseDate(from);
  const b = to ? parseDate(to) : (() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  })();
  if (!a || !b) return null;
  let age = b.year - a.year;
  if (a.month && b.month) {
    if (b.month < a.month || (b.month === a.month && a.day && b.day && b.day < a.day)) age -= 1;
  }
  return age >= 0 ? age : null;
}

export function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}
