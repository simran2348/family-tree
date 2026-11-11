import { X } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import { getParentLinks, getChildLinks, getPartnerLinks, getSiblings, sortByBirth } from '../../utils/graph';
import { displayName, lifespan } from '../../utils/person';
import { PARTNER_TYPES, PARENT_TYPES } from '../../constants/defaults';
import Avatar from '../ui/Avatar';

function RelativeChip({ person, meta, onRemove, children }) {
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const requestViewport = useUiStore((s) => s.requestViewport);
  return (
    <li className="group flex items-center gap-2 py-1">
      <button
        type="button"
        className="flex flex-1 min-w-0 items-center gap-2 text-left rounded-[var(--radius)] -mx-1 px-1 py-0.5 hover:bg-surface-alt"
        onClick={() => { selectPerson(person.id); requestViewport('center', person.id); }}
      >
        <Avatar person={person} size={28} />
        <span className="min-w-0">
          <span className="block text-[0.84rem] truncate">{displayName(person)}</span>
          <span className="block text-[0.7rem] text-muted truncate">{[lifespan(person), meta].filter(Boolean).join(' · ')}</span>
        </span>
      </button>
      {children}
      {onRemove && (
        <button type="button" className="icon-btn h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted" onClick={onRemove}
          aria-label={`Remove link to ${displayName(person)}`} title="Remove this relationship">
          <X size={13} />
        </button>
      )}
    </li>
  );
}

export default function RelativesList({ personId }) {
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const removeRelationship = useTreeStore((s) => s.removeRelationship);
  const updateRelationship = useTreeStore((s) => s.updateRelationship);
  const parents = getParentLinks(tree, personId);
  const partners = getPartnerLinks(tree, personId);
  const children = getChildLinks(tree, personId);
  const sortedChildren = sortByBirth(tree, children.map((c) => c.id)).map((id) => children.find((c) => c.id === id));
  const siblings = getSiblings(tree, personId);

  const unlink = (rel, other) => {
    removeRelationship(rel.id);
    toast(`Removed link to ${displayName(tree.people[other])}. ⌘Z to undo.`, 'success');
  };

  const groups = [
    parents.length > 0 && {
      title: 'Parents',
      items: parents.map((l) => (
        <RelativeChip key={l.rel.id} person={tree.people[l.id]} meta={l.rel.subtype && l.rel.subtype !== 'biological' ? PARENT_TYPES.find((t) => t.id === l.rel.subtype)?.label : ''} onRemove={() => unlink(l.rel, l.id)} />
      )),
    },
    partners.length > 0 && {
      title: partners.length > 1 ? 'Partners' : 'Partner',
      items: partners.map((l) => (
        <RelativeChip key={l.rel.id} person={tree.people[l.id]} onRemove={() => unlink(l.rel, l.id)}>
          <select
            className="select !w-[6.5rem] !py-0.5 !text-[0.72rem] !pl-1.5"
            value={l.rel.status || 'partner'}
            onChange={(e) => updateRelationship(l.rel.id, { status: e.target.value })}
            aria-label="Partnership status"
          >
            {PARTNER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </RelativeChip>
      )),
    },
    sortedChildren.length > 0 && {
      title: 'Children',
      items: sortedChildren.map((l) => (
        <RelativeChip key={l.rel.id} person={tree.people[l.id]} meta={l.rel.subtype && l.rel.subtype !== 'biological' ? PARENT_TYPES.find((t) => t.id === l.rel.subtype)?.label : ''} onRemove={() => unlink(l.rel, l.id)} />
      )),
    },
    siblings.all.length > 0 && {
      title: 'Siblings',
      items: siblings.all.map((id) => (
        <RelativeChip key={id} person={tree.people[id]} meta={siblings.half.includes(id) ? 'Half-sibling' : ''} />
      )),
    },
  ].filter(Boolean);

  if (!groups.length) return <p className="text-[0.8rem] text-muted mt-4">No relatives linked yet.</p>;

  return (
    <div className="mt-4 space-y-3">
      {groups.map((g) => (
        <section key={g.title}>
          <h4 className="label">{g.title}</h4>
          <ul>{g.items}</ul>
        </section>
      ))}
    </div>
  );
}
