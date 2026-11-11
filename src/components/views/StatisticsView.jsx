import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Layers, HeartHandshake, Hourglass, Camera, Copy } from 'lucide-react';
import { useActiveTree, useTreeStore } from '../../store/familyTreeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import { computeStats } from '../../utils/stats';
import { findDuplicatePairs } from '../../utils/duplicates';
import { fullName, lifespan } from '../../utils/person';
import { formatDate } from '../../utils/dates';
import Avatar from '../ui/Avatar';

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-muted text-[0.75rem] uppercase tracking-wider font-semibold"><Icon size={14} /> {label}</div>
      <div className="font-heading text-4xl font-semibold mt-1 tabular-nums">{value ?? '—'}</div>
      {hint && <div className="text-[0.75rem] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

function Bars({ items, total }) {
  return (
    <ul className="space-y-2">
      {items.map(([label, n, color]) => (
        <li key={label}>
          <div className="flex justify-between text-[0.8rem]"><span>{label}</span><span className="text-muted tabular-nums">{n}</span></div>
          <div className="h-1.5 rounded-full bg-surface-alt mt-1 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${total ? (n / total) * 100 : 0}%`, background: color || 'var(--c-accent)' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StatisticsView() {
  const tree = useActiveTree();
  const general = useSettingsStore((s) => s.general);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const navigate = useNavigate();
  const stats = useMemo(() => computeStats(tree), [tree]);
  const dupes = useMemo(() => findDuplicatePairs(tree), [tree]);
  const fmt = (d) => formatDate(d, general.dateFormat, general.locale);

  const goTo = (id) => { selectPerson(id); navigate('/'); setTimeout(() => requestViewport('center', id), 250); };

  const PersonRow = ({ label, person, detail }) => person ? (
    <button type="button" onClick={() => goTo(person.id)} className="w-full flex items-center gap-3 py-2 text-left hover:bg-surface-alt rounded-[var(--radius)] px-2 -mx-2">
      <Avatar person={person} size={36} />
      <span className="flex-1 min-w-0">
        <span className="block text-[0.7rem] uppercase tracking-wider text-muted">{label}</span>
        <span className="block text-[0.88rem] truncate">{fullName(person)}</span>
      </span>
      <span className="text-[0.75rem] text-muted text-right">{detail}</span>
    </button>
  ) : null;

  const g = stats.gender;
  return (
    <div className="flex-1 overflow-y-auto scroll-thin bg-canvas">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="font-heading text-3xl font-semibold">{tree.name}</h1>
        <p className="text-sm text-muted mt-1">{stats.earliestYear ? `Records reaching back to ${stats.earliestYear}` : 'Family statistics'}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <Stat icon={Users} label="Family members" value={stats.total} hint={`${stats.living} living · ${stats.deceased} deceased`} />
          <Stat icon={Layers} label="Generations" value={stats.generations} />
          <Stat icon={HeartHandshake} label="Partnerships" value={stats.partnerships} />
          <Stat icon={Hourglass} label="Average lifespan" value={stats.averageLifespan ? `${stats.averageLifespan}` : '—'} hint={stats.averageLifespan ? 'years, of those with full dates' : 'Needs birth and death dates'} />
        </div>

        <div className="grid lg:grid-cols-3 gap-3 mt-3">
          <div className="panel p-4">
            <h2 className="font-heading text-lg font-semibold mb-3">Gender distribution</h2>
            <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-surface-alt">
              {[[g.male, '#5f7f9a'], [g.female, '#b07a84'], [g.other, '#9a8a5f'], [g.unknown, 'var(--c-border)']].map(([n, c], i) => n > 0 && (
                <div key={i} style={{ width: `${(n / stats.total) * 100}%`, background: c }} />
              ))}
            </div>
            <Bars total={stats.total} items={[['Male', g.male, '#5f7f9a'], ['Female', g.female, '#b07a84'], ['Other', g.other, '#9a8a5f'], ['Unknown', g.unknown, 'var(--c-muted)']].filter((x) => x[1] > 0)} />
          </div>
          <div className="panel p-4">
            <h2 className="font-heading text-lg font-semibold mb-3">Common surnames</h2>
            {stats.surnames.length ? <Bars total={stats.surnames[0][1]} items={stats.surnames} /> : <p className="text-sm text-muted">No surnames recorded.</p>}
          </div>
          <div className="panel p-4">
            <h2 className="font-heading text-lg font-semibold mb-3">Birthplaces</h2>
            {stats.places.length ? <Bars total={stats.places[0][1]} items={stats.places.map(([p, n]) => [p, n, 'var(--c-accent2)'])} /> : <p className="text-sm text-muted">No birthplaces recorded.</p>}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3 mt-3">
          <div className="panel p-4">
            <h2 className="font-heading text-lg font-semibold mb-1">Notable members</h2>
            <PersonRow label="Earliest born" person={stats.oldestEver} detail={stats.oldestEver && fmt(stats.oldestEver.birthDate)} />
            <PersonRow label="Oldest living" person={stats.oldestLiving} detail={stats.oldestLiving && lifespan(stats.oldestLiving)} />
            <PersonRow label="Youngest" person={stats.youngest} detail={stats.youngest && fmt(stats.youngest.birthDate)} />
            {stats.longestLived && <PersonRow label="Longest lived" person={tree.people[stats.longestLived.id]} detail={`${stats.longestLived.age} years`} />}
          </div>
          <div className="panel p-4">
            <h2 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2"><Copy size={16} className="text-muted" /> Possible duplicates</h2>
            {!dupes.length && <p className="text-sm text-muted py-2">No likely duplicates found.</p>}
            {dupes.map(([a, b]) => (
              <div key={a + b} className="flex items-center gap-2 py-2 border-b border-line/60 last:border-0 text-[0.84rem]">
                <button type="button" className="flex-1 truncate text-left hover:underline" onClick={() => goTo(a)}>{fullName(tree.people[a])} <span className="text-muted">({lifespan(tree.people[a])})</span></button>
                <span className="text-muted">≈</span>
                <button type="button" className="flex-1 truncate text-left hover:underline" onClick={() => goTo(b)}>{fullName(tree.people[b])} <span className="text-muted">({lifespan(tree.people[b])})</span></button>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 text-[0.78rem] text-muted"><Camera size={13} /> {stats.photos} of {stats.total} people have a profile photograph.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
