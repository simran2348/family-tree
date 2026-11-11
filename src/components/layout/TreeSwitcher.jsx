import { ChevronDown, Check, Plus, Copy, Pencil, Trash2, Sparkles, Upload } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import Popover from '../ui/Popover';

export default function TreeSwitcher() {
  const trees = useTreeStore((s) => s.trees);
  const order = useTreeStore((s) => s.treeOrder);
  const activeId = useTreeStore((s) => s.activeTreeId);
  const switchTree = useTreeStore((s) => s.switchTree);
  const duplicateTree = useTreeStore((s) => s.duplicateTree);
  const createTree = useTreeStore((s) => s.createTree);
  const deleteTree = useTreeStore((s) => s.deleteTree);
  const openModal = useUiStore((s) => s.openModal);
  const active = trees[activeId];

  return (
    <Popover
      align="left"
      className="w-72"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-1.5 max-w-[8.5rem] sm:max-w-[16rem] rounded-[var(--radius)] px-2 h-8 text-header-fg hover:bg-header-fg/12"
        >
          <span className="truncate font-heading text-[1.1rem] font-semibold">{active?.name || 'Family tree'}</span>
          <ChevronDown size={15} className="shrink-0 opacity-70" />
        </button>
      )}
    >
      {(close) => (
        <div className="text-fg">
          <div className="px-2 pt-1 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">Your trees</div>
          <div className="max-h-60 overflow-y-auto scroll-thin">
            {order.map((id) => (
              <button key={id} type="button" className="menu-item" data-active={id === activeId} onClick={() => { switchTree(id); close(); }}>
                <span className="w-4">{id === activeId && <Check size={14} className="text-accent" />}</span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{trees[id].name}</span>
                  <span className="block text-[0.7rem] text-muted">{Object.keys(trees[id].people).length} people</span>
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-line my-1" />
          <button type="button" className="menu-item" onClick={() => { close(); openModal('treeName', { mode: 'create' }); }}>
            <Plus size={15} className="text-muted" /> New empty tree
          </button>
          <button type="button" className="menu-item" onClick={() => { close(); createTree('The Hartley Family', { sample: true }); toast('Sample tree created.', 'success'); }}>
            <Sparkles size={15} className="text-muted" /> New tree from sample
          </button>
          <button type="button" className="menu-item" onClick={() => { close(); openModal('import'); }}>
            <Upload size={15} className="text-muted" /> Import tree…
          </button>
          <div className="border-t border-line my-1" />
          <button type="button" className="menu-item" onClick={() => { close(); openModal('treeName', { mode: 'rename' }); }}>
            <Pencil size={15} className="text-muted" /> Rename “{active?.name}”
          </button>
          <button type="button" className="menu-item" onClick={() => { close(); duplicateTree(activeId); toast('Tree duplicated.', 'success'); }}>
            <Copy size={15} className="text-muted" /> Duplicate tree
          </button>
          <button
            type="button"
            className="menu-item !text-[#b4483d]"
            onClick={() => {
              close();
              openModal('confirm', {
                title: `Delete “${active?.name}”?`,
                message: `All ${Object.keys(active?.people || {}).length} people and their photos in this tree will be permanently removed. Consider exporting a backup first.`,
                confirmLabel: 'Delete tree',
                danger: true,
                requireText: active?.name,
                onConfirm: () => { deleteTree(activeId); toast('Tree deleted.', 'success'); },
              });
            }}
          >
            <Trash2 size={15} /> Delete tree
          </button>
        </div>
      )}
    </Popover>
  );
}
