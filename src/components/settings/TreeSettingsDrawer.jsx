import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { LayoutSettings, CardSettings, ConnectorSettings, CanvasSettings } from './TreeSettings';

const TABS = [
  { id: 'layout', label: 'Layout', C: LayoutSettings },
  { id: 'cards', label: 'Cards', C: CardSettings },
  { id: 'lines', label: 'Lines', C: ConnectorSettings },
  { id: 'canvas', label: 'Canvas', C: CanvasSettings },
];

/** Tree settings beside the canvas so every change is previewed live. */
export default function TreeSettingsDrawer() {
  const open = useUiStore((s) => s.treeSettingsOpen);
  const setOpen = useUiStore((s) => s.setTreeSettingsOpen);
  const resetSections = useSettingsStore((s) => s.resetSections);
  const [tab, setTab] = useState('layout');
  if (!open) return null;
  const Active = TABS.find((t) => t.id === tab).C;
  return (
    <aside className="absolute top-16 right-3 bottom-3 z-20 w-[min(23rem,calc(100%-1.5rem))] flex flex-col popover anim-slide" aria-label="Tree settings">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="font-heading text-xl font-semibold">Tree settings</h2>
        <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close tree settings"><X size={17} /></button>
      </div>
      <div role="tablist" className="flex gap-1 px-3 pb-2 border-b border-line">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`flex-1 h-7 rounded-[calc(var(--radius)*0.8)] text-[0.78rem] ${tab === t.id ? 'bg-accent/12 text-accent font-semibold' : 'text-muted hover:bg-surface-alt'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3"><Active /></div>
      <div className="px-4 py-2.5 border-t border-line">
        <button type="button" className="btn btn-outline btn-sm w-full" onClick={() => resetSections(['layout', 'card', 'connector', 'canvas'])}>
          <RotateCcw size={13} /> Reset all tree settings to default
        </button>
      </div>
    </aside>
  );
}
