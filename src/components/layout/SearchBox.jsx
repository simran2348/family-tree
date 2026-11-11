import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, History, MapPin } from 'lucide-react';
import { useTreeStore, useActiveTree } from '../../store/familyTreeStore';
import { useUiStore } from '../../store/uiStore';
import { fullName, lifespan } from '../../utils/person';
import { getYear } from '../../utils/dates';
import { useClickOutside } from '../../hooks/useClickOutside';
import Avatar from '../ui/Avatar';

function score(p, q) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const fields = {
    first: (p.firstName || '').toLowerCase(),
    last: `${p.lastName || ''} ${p.birthSurname || ''}`.toLowerCase(),
    full: fullName(p).toLowerCase(),
    year: String(getYear(p.birthDate) || ''),
    place: `${p.birthPlace || ''} ${p.location || ''}`.toLowerCase(),
  };
  let total = 0;
  for (const t of tokens) {
    if (fields.first.startsWith(t)) total += 5;
    else if (fields.last.split(' ').some((s) => s.startsWith(t))) total += 4;
    else if (fields.full.includes(t)) total += 3;
    else if (/^\d{3,4}$/.test(t) && fields.year.startsWith(t)) total += 4;
    else if (fields.place.includes(t)) total += 2;
    else return 0;
  }
  return total;
}

export const focusSearch = () => document.getElementById('global-search')?.focus();

export default function SearchBox() {
  const tree = useActiveTree();
  const recent = useTreeStore((s) => s.recent);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const results = useMemo(() => {
    const people = Object.values(tree?.people || {});
    if (!q.trim()) return recent.map((id) => tree.people[id]).filter(Boolean).slice(0, 6);
    return people
      .map((p) => ({ p, s: score(p, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.p);
  }, [q, tree, recent]);

  useEffect(() => setActive(0), [q]);

  const choose = (p) => {
    selectPerson(p.id);
    setSidebarOpen(true);
    setOpen(false);
    setQ('');
    document.getElementById('global-search')?.blur();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => requestViewport('center', p.id), 250);
    } else requestViewport('center', p.id);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) choose(results[active]);
    if (e.key === 'Escape') { setOpen(false); e.currentTarget.blur(); }
  };

  return (
    <div className="relative w-full max-w-xs" ref={ref}>
      <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-header-fg/60 pointer-events-none" />
      <input
        id="global-search"
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search people, years, places…"
        autoComplete="off"
        aria-label="Search family members"
        aria-expanded={open}
        aria-controls="search-results"
        className="w-full h-8 rounded-[var(--radius)] pl-8 pr-10 text-[0.82rem] bg-header-fg/12 text-header-fg placeholder:text-header-fg/55 border border-header-fg/15 focus:outline-none focus:bg-header-fg/18 focus:border-header-fg/35"
      />
      <span className="kbd absolute right-2 top-1/2 -translate-y-1/2 !bg-transparent !text-header-fg/55 !border-header-fg/20 hidden md:inline-block">⌘K</span>
      {open && (
        <div id="search-results" role="listbox" className="absolute left-0 right-0 top-full mt-1.5 popover anim-pop p-1.5 z-50 text-fg min-w-72">
          {!q.trim() && results.length > 0 && (
            <div className="px-2 pt-0.5 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
              <History size={11} /> Recently viewed
            </div>
          )}
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              className="menu-item"
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(p)}
            >
              <Avatar person={p} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{fullName(p)}</span>
                <span className="flex items-center gap-1 text-[0.72rem] text-muted truncate">
                  {lifespan(p)}
                  {(p.location || p.birthPlace) && <><MapPin size={10} className="ml-1" />{p.location || p.birthPlace}</>}
                </span>
              </span>
            </button>
          ))}
          {q.trim() && !results.length && <div className="px-2 py-3 text-sm text-muted text-center">No one matches “{q}”.</div>}
          {!q.trim() && !results.length && <div className="px-2 py-3 text-[0.8rem] text-muted text-center">Search by name, birth year or place.</div>}
        </div>
      )}
    </div>
  );
}
