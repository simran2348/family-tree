import { UserPlus, Upload, Sparkles } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useTreeStore } from '../../store/familyTreeStore';

export default function EmptyTree() {
  const openModal = useUiStore((s) => s.openModal);
  const resetToSample = useTreeStore((s) => s.createTree);
  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className="max-w-sm text-center anim-pop">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <UserPlus size={24} />
        </div>
        <h2 className="font-heading text-2xl font-semibold">Start your family tree</h2>
        <p className="text-sm text-muted mt-1.5 mb-5">Add the first person — usually yourself — then grow the tree by adding parents, partners and children.</p>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-primary" onClick={() => openModal('addPerson', { kind: 'none' })}>
            <UserPlus size={16} /> Add first person
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-outline" onClick={() => openModal('import')}>
              <Upload size={15} /> Import
            </button>
            <button type="button" className="btn btn-outline" onClick={() => resetToSample('The Hartley Family', { sample: true })}>
              <Sparkles size={15} /> Sample tree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
