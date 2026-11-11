import { useEffect, useRef, useState } from 'react';
import {
  UserRound, Pencil, Users, UserPlus, Heart, Baby, Home, LocateFixed, ChevronsDownUp, ChevronsUpDown, Trash2, CheckSquare, Square, Crosshair,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useTreeStore } from '../../store/familyTreeStore';
import { getChildren } from '../../utils/graph';
import { displayName } from '../../utils/person';
import { useClickOutside } from '../../hooks/useClickOutside';
import { usePersonActions } from '../../hooks/usePersonActions';

export default function ContextMenu() {
  const menu = useUiStore((s) => s.contextMenu);
  const close = useUiStore((s) => s.closeContextMenu);
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const multiSelect = useTreeStore((s) => s.multiSelect);
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const actions = usePersonActions();
  useClickOutside(ref, close, Boolean(menu));

  useEffect(() => {
    if (!menu) return;
    const el = ref.current;
    const w = el?.offsetWidth || 220;
    const h = el?.offsetHeight || 380;
    setPos({ x: Math.min(menu.x, window.innerWidth - w - 8), y: Math.min(menu.y, window.innerHeight - h - 8) });
  }, [menu]);

  if (!menu || !tree?.people[menu.personId]) return null;
  const id = menu.personId;
  const person = tree.people[id];
  const hasKids = getChildren(tree, id).length > 0;
  const collapsed = tree.collapsed.includes(id);
  const run = (fn) => () => { close(); fn(); };

  const items = [
    { icon: UserRound, label: 'Open profile', onClick: () => actions.openProfile(id) },
    { icon: Pencil, label: 'Edit details', onClick: () => actions.edit(id), kbd: 'E' },
    'sep',
    { icon: Users, label: 'Add parent', onClick: () => actions.add('parent', id), kbd: 'P' },
    { icon: UserPlus, label: 'Add sibling', onClick: () => actions.add('sibling', id), kbd: 'S' },
    { icon: Heart, label: 'Add partner', onClick: () => actions.add('partner', id), kbd: 'M' },
    { icon: Baby, label: 'Add child', onClick: () => actions.add('child', id), kbd: 'C' },
    'sep',
    { icon: LocateFixed, label: 'Center on canvas', onClick: () => actions.center(id) },
    { icon: Home, label: 'Set as home person', onClick: () => actions.setHome(id), disabled: tree.homePersonId === id },
    { icon: Crosshair, label: 'Use as layout focus', onClick: () => actions.focusLayout(id) },
    hasKids && { icon: collapsed ? ChevronsUpDown : ChevronsDownUp, label: collapsed ? 'Expand branch' : 'Collapse branch', onClick: () => actions.toggleBranch(id) },
    { icon: multiSelect.includes(id) ? CheckSquare : Square, label: multiSelect.includes(id) ? 'Remove from export selection' : 'Add to export selection', onClick: () => actions.toggleMulti(id) },
    'sep',
    { icon: Trash2, label: 'Delete person', onClick: () => actions.remove(id), danger: true, kbd: 'Del' },
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      className="fixed z-[60] popover anim-pop p-1.5 w-56"
      style={{ left: pos?.x ?? menu.x, top: pos?.y ?? menu.y }}
      role="menu"
      aria-label={`Actions for ${displayName(person)}`}
    >
      <div className="px-2 pt-1 pb-1.5 text-[0.78rem] font-semibold truncate font-heading text-[0.95rem]">{displayName(person)}</div>
      {items.map((item, i) =>
        item === 'sep' ? (
          <div key={`s${i}`} className="border-t border-line my-1" />
        ) : (
          <button key={item.label} type="button" role="menuitem" className={`menu-item ${item.danger ? '!text-[#b4483d]' : ''}`} disabled={item.disabled} onClick={run(item.onClick)}>
            <item.icon size={15} className={item.danger ? '' : 'text-muted'} />
            <span className="flex-1">{item.label}</span>
            {item.kbd && <span className="kbd">{item.kbd}</span>}
          </button>
        ),
      )}
    </div>
  );
}
