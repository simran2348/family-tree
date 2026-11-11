import { Pencil, Users, UserPlus, Heart, Baby, Trash2, Home, X } from 'lucide-react';
import { useTreeStore, useSelectedPerson } from '../../store/familyTreeStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { usePersonActions } from '../../hooks/usePersonActions';
import { getRelationshipLabel } from '../../utils/kinship';
import { displayName, lifespan, ageLabel } from '../../utils/person';
import Avatar from '../ui/Avatar';
import { PersonalView } from './PersonalTab';
import { BiographyView } from './BiographyTab';
import ImageTab from './ImageTab';
import PersonForm from './PersonForm';

const TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'biography', label: 'Biography' },
  { id: 'image', label: 'Image' },
];

export default function PersonDetails() {
  const person = useSelectedPerson();
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const multiSelect = useTreeStore((s) => s.multiSelect);
  const setMultiSelect = useTreeStore((s) => s.setMultiSelect);
  const tab = useUiStore((s) => s.sidebarTab);
  const setTab = useUiStore((s) => s.setSidebarTab);
  const editing = useUiStore((s) => s.editing);
  const setEditing = useUiStore((s) => s.setEditing);
  const relativeTo = useSettingsStore((s) => s.general.relativeTo);
  const actions = usePersonActions();

  if (!person) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-muted">
        <Users size={28} className="mb-2 opacity-60" />
        <p className="text-sm">Select someone on the canvas to see their details.</p>
      </div>
    );
  }

  const home = tree.people[tree.homePersonId];
  const relation = home && relativeTo === 'home' && home.id !== person.id ? getRelationshipLabel(tree, home.id, person.id) : '';
  const isHome = tree.homePersonId === person.id;

  const actionButtons = [
    { icon: Users, label: 'Add Parents', onClick: () => actions.add('parent', person.id) },
    { icon: UserPlus, label: 'Add Sibling', onClick: () => actions.add('sibling', person.id) },
    { icon: Heart, label: 'Add Partner', onClick: () => actions.add('partner', person.id) },
    { icon: Baby, label: 'Add Child', onClick: () => actions.add('child', person.id) },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {multiSelect.length > 0 && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-[var(--radius)] bg-accent-2/12 px-2.5 py-1.5 text-[0.75rem]">
          <span className="flex-1">{multiSelect.length} selected for export (shift-click cards)</span>
          <button type="button" className="icon-btn h-6 w-6" onClick={() => setMultiSelect([])} aria-label="Clear selection"><X size={13} /></button>
        </div>
      )}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3.5">
        <button type="button" onClick={() => { setTab('image'); setEditing(false); }} className="rounded-full" aria-label="Change photograph" title="Change photograph">
          <Avatar person={person} size={68} ring />
        </button>
        <div className="min-w-0">
          {relation && <div className="text-[0.66rem] font-semibold uppercase tracking-[0.09em] text-accent truncate">{relation} of {home.firstName}</div>}
          {isHome && <div className="text-[0.66rem] font-semibold uppercase tracking-[0.09em] text-accent flex items-center gap-1"><Home size={11} /> Home person</div>}
          <h2 className="font-heading text-[1.45rem] font-semibold leading-tight break-words">{displayName(person)}</h2>
          <div className="text-[0.78rem] text-muted tabular-nums">{[lifespan(person), ageLabel(person)].filter(Boolean).join(' · ')}</div>
        </div>
      </div>

      <div role="tablist" aria-label="Person details" className="flex px-4 border-b border-line gap-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative py-2 text-[0.82rem] transition-colors ${tab === t.id ? 'text-fg font-semibold' : 'text-muted hover:text-fg'}`}
          >
            {t.label}
            {tab === t.id && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent rounded-full" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 pt-3" role="tabpanel">
        {tab === 'image' ? (
          <div className="pb-4"><ImageTab person={person} /></div>
        ) : editing ? (
          <PersonForm key={person.id} person={person} tab={tab} onDone={() => setEditing(false)} />
        ) : tab === 'personal' ? (
          <div className="pb-4"><PersonalView person={person} /></div>
        ) : (
          <div className="pb-4"><BiographyView person={person} /></div>
        )}
      </div>

      {!editing && (
        <div className="border-t border-line p-3 space-y-1.5 bg-sidebar">
          <div className="grid grid-cols-2 gap-1.5">
            {actionButtons.map((a) => (
              <button key={a.label} type="button" className="btn btn-outline btn-sm !justify-start" onClick={a.onClick}>
                <a.icon size={14} className="text-accent" /> {a.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { if (tab === 'image') setTab('personal'); setEditing(true); }}>
              <Pencil size={14} /> Edit Person
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => actions.remove(person.id)}>
              <Trash2 size={14} /> Delete Person
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
