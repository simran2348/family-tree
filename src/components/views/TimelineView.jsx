import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Cross, Heart, HeartCrack, Star, Cake, Flower2, CalendarHeart } from 'lucide-react';
import { useActiveTree, useTreeStore } from '../../store/familyTreeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import { buildTimeline, upcomingAnniversaries } from '../../utils/timeline';
import { formatDate, getYear } from '../../utils/dates';
import Avatar from '../ui/Avatar';

const KINDS = {
  birth: { label: 'Births', icon: Baby },
  death: { label: 'Deaths', icon: Cross },
  marriage: { label: 'Partnerships', icon: Heart },
  separation: { label: 'Separations', icon: HeartCrack },
  event: { label: 'Life events', icon: Star },
};
const ANNIV = { birthday: Cake, remembrance: Flower2, anniversary: CalendarHeart };

export default function TimelineView() {
  const tree = useActiveTree();
  const general = useSettingsStore((s) => s.general);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const navigate = useNavigate();
  const [filter, setFilter] = useState(() => new Set(Object.keys(KINDS)));
  const events = useMemo(() => buildTimeline(tree), [tree]);
  const upcoming = useMemo(() => upcomingAnniversaries(tree, 60), [tree]);
  const fmt = (d) => formatDate(d, general.dateFormat, general.locale);

  const weekEnd = (() => {
    const now = new Date();
    const diff = (7 + now.getDay() - general.weekStart) % 7;
    return 6 - diff; // days remaining in the current week
  })();
  const thisWeek = upcoming.filter((u) => u.inDays <= weekEnd);
  const later = upcoming.filter((u) => u.inDays > weekEnd);

  const byDecade = useMemo(() => {
    const groups = new Map();
    for (const ev of events.filter((e) => filter.has(e.kind))) {
      const decade = Math.floor(getYear(ev.date) / 10) * 10;
      if (!groups.has(decade)) groups.set(decade, []);
      groups.get(decade).push(ev);
    }
    return [...groups.entries()];
  }, [events, filter]);

  const goTo = (id) => {
    selectPerson(id);
    navigate('/');
    setTimeout(() => requestViewport('center', id), 250);
  };

  const toggle = (k) => setFilter((f) => { const n = new Set(f); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const AnnivItem = ({ u }) => {
    const Icon = ANNIV[u.kind];
    return (
      <li>
        <button type="button" onClick={() => goTo(u.personIds[0])} className="w-full flex items-center gap-2.5 py-2 text-left hover:bg-surface-alt rounded-[var(--radius)] px-2 -mx-2">
          <Icon size={15} className="text-accent shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-[0.84rem] truncate">{u.title}</span>
            <span className="block text-[0.72rem] text-muted">
              {u.inDays === 0 ? 'Today' : u.inDays === 1 ? 'Tomorrow' : u.next.toLocaleDateString(general.locale, { weekday: 'short', day: 'numeric', month: 'short' })}
              {u.years > 0 && ` · ${u.years} year${u.years === 1 ? '' : 's'}`}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scroll-thin bg-canvas">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid lg:grid-cols-[1fr_20rem] gap-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Family timeline</h1>
          <p className="text-sm text-muted mt-1">{events.length} dated events across {byDecade.length} decades</p>
          <div className="flex flex-wrap gap-1.5 mt-4" role="group" aria-label="Filter events">
            {Object.entries(KINDS).map(([k, v]) => (
              <button key={k} type="button" aria-pressed={filter.has(k)} onClick={() => toggle(k)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[0.76rem] transition-colors ${filter.has(k) ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'}`}>
                <v.icon size={12} /> {v.label}
              </button>
            ))}
          </div>

          {!byDecade.length && <p className="mt-10 text-muted text-sm">No dated events yet. Add birth dates, marriages and life events to build the timeline.</p>}

          <div className="mt-6 space-y-8">
            {byDecade.map(([decade, list]) => (
              <section key={decade}>
                <h2 className="sticky top-0 z-10 bg-canvas/95 backdrop-blur py-1 font-heading text-xl font-semibold text-accent">{decade}s</h2>
                <ol className="relative border-l border-line ml-3 mt-2">
                  {list.map((ev) => {
                    const Icon = KINDS[ev.kind].icon;
                    return (
                      <li key={ev.id} className="relative pl-7 py-2">
                        <span className="absolute -left-3 top-2.5 h-6 w-6 rounded-full bg-surface border border-line flex items-center justify-center">
                          <Icon size={12} className="text-accent" />
                        </span>
                        <div className="text-[0.72rem] text-muted tabular-nums">{fmt(ev.date)}{ev.place ? ` · ${ev.place}` : ''}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[0.9rem]">{ev.title}</span>
                          <span className="flex -space-x-1.5">
                            {ev.personIds.map((id) => tree.people[id] && (
                              <button key={id} type="button" onClick={() => goTo(id)} title={`Show ${tree.people[id].firstName} on the tree`} className="rounded-full">
                                <Avatar person={tree.people[id]} size={22} ring />
                              </button>
                            ))}
                          </span>
                        </div>
                        {ev.description && <div className="text-[0.8rem] text-muted">{ev.description}</div>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-8 self-start space-y-4">
          <div className="panel p-4">
            <h2 className="font-heading text-lg font-semibold">Important dates</h2>
            <p className="text-[0.75rem] text-muted mb-2">Birthdays, anniversaries and remembrances in the next 60 days</p>
            {!upcoming.length && <p className="text-[0.8rem] text-muted py-2">Nothing coming up. Full dates (day and month) are needed.</p>}
            {thisWeek.length > 0 && (<><h3 className="label mt-2">This week</h3><ul>{thisWeek.map((u) => <AnnivItem key={u.id} u={u} />)}</ul></>)}
            {later.length > 0 && (<><h3 className="label mt-3">Coming up</h3><ul>{later.slice(0, 12).map((u) => <AnnivItem key={u.id} u={u} />)}</ul></>)}
          </div>
        </aside>
      </div>
    </div>
  );
}
