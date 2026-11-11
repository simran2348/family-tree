import FamilyTree from '../family-tree/FamilyTree';
import TreeControls from '../family-tree/TreeControls';
import TreeSettingsDrawer from '../settings/TreeSettingsDrawer';
import { useActiveTree } from '../../store/familyTreeStore';
import { LAYOUT_PRESETS } from '../../constants/defaults';
import { Hand, Users } from 'lucide-react';

function StatusBar() {
  const tree = useActiveTree();
  const preset = LAYOUT_PRESETS.find((p) => p.id === tree.layoutPreset);
  const focus = tree.people[tree.layoutFocusId || tree.homePersonId];
  const focused = ['descendants', 'ancestors', 'pedigree'].includes(tree.layoutPreset);
  return (
    <div className="absolute left-3 top-3 z-10 hidden lg:flex flex-wrap items-center gap-1.5 text-[0.72rem] pointer-events-none">
      <span className="popover px-2 py-1 flex items-center gap-1.5 text-muted"><Users size={12} /> {Object.keys(tree.people).length} people</span>
      <span className="popover px-2 py-1 text-muted hidden sm:inline">{preset?.label}{focused && focus ? ` · ${focus.firstName}` : ''}</span>
      {tree.layoutMode === 'manual' && <span className="popover px-2 py-1 text-accent flex items-center gap-1"><Hand size={12} /> Manual layout</span>}
      {tree.collapsed.length > 0 && <span className="popover px-2 py-1 text-muted">{tree.collapsed.length} branch{tree.collapsed.length > 1 ? 'es' : ''} collapsed</span>}
    </div>
  );
}

export default function MainCanvas() {
  return (
    <main className="relative flex-1 min-w-0 bg-canvas" aria-label="Family tree">
      <FamilyTree />
      <StatusBar />
      <TreeControls />
      <TreeSettingsDrawer />
    </main>
  );
}
