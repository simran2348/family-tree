import { useEffect } from 'react';
import { useStore } from '@xyflow/react';
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, Expand, Settings2, LayoutTemplate, Download, RotateCcw, Check, Hand, Wand2, LocateFixed,
} from 'lucide-react';
import { useUiStore, toast } from '../../store/uiStore';
import { useTreeStore, useActiveTree } from '../../store/familyTreeStore';
import { LAYOUT_PRESETS } from '../../constants/defaults';
import Popover from '../ui/Popover';

function ToolButton({ icon: Icon, label, onClick, pressed, shortcut }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon size={17} strokeWidth={1.75} />
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px bg-line" aria-hidden="true" />;

export function toggleFullscreen() {
  const { setFullscreen } = useUiStore.getState();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => setFullscreen(true));
    setFullscreen(true);
  } else {
    document.exitFullscreen?.();
    setFullscreen(false);
  }
}

function LayoutMenu() {
  const tree = useActiveTree();
  const selectedId = useTreeStore((s) => s.selectedId);
  const setLayoutPreset = useTreeStore((s) => s.setLayoutPreset);
  const setLayoutMode = useTreeStore((s) => s.setLayoutMode);
  const resetLayout = useTreeStore((s) => s.resetLayout);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const manual = tree.layoutMode === 'manual';
  const people = tree.people;

  return (
    <Popover
      className="w-72"
      trigger={({ open, toggle }) => (
        <ToolButton icon={LayoutTemplate} label="Layout" onClick={toggle} pressed={open} />
      )}
    >
      {(close) => (
        <div className="text-fg">
          <div className="px-2 pt-1 pb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Positioning</div>
          <div className="grid grid-cols-2 gap-1 px-1 pb-2">
            <button type="button" className={`btn btn-sm ${!manual ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setLayoutMode('auto'); requestViewport('fit'); }}>
              <Wand2 size={14} /> Automatic
            </button>
            <button type="button" className={`btn btn-sm ${manual ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setLayoutMode('manual'); toast('Manual layout: drag cards to arrange them.'); }}>
              <Hand size={14} /> Manual
            </button>
          </div>
          <div className="border-t border-line my-1" />
          <div className="px-2 pt-1 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Automatic layouts</div>
          {LAYOUT_PRESETS.map((p) => {
            const needsFocus = ['descendants', 'ancestors', 'pedigree'].includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className="menu-item"
                data-active={tree.layoutPreset === p.id}
                onClick={() => {
                  setLayoutPreset(p.id, needsFocus ? selectedId || tree.homePersonId : undefined);
                  close();
                }}
              >
                <span className="w-4 shrink-0">{tree.layoutPreset === p.id && <Check size={14} className="text-accent" />}</span>
                <span className="min-w-0">
                  <span className="block">{p.label}</span>
                  <span className="block text-[0.72rem] text-muted truncate">
                    {needsFocus && selectedId ? `${p.hint.replace('Selected person', 'From')}${needsFocus ? ` — ${people[selectedId]?.firstName || ''}` : ''}` : p.hint}
                  </span>
                </span>
              </button>
            );
          })}
          <div className="border-t border-line my-1" />
          <button type="button" className="menu-item" disabled={!manual && !Object.keys(tree.positions).length}
            onClick={() => { resetLayout(); requestViewport('fit'); toast('Layout reset to automatic.', 'success'); close(); }}>
            <RotateCcw size={14} className="text-muted" /> Reset to automatic layout
          </button>
          {manual && (
            <p className="px-2 pb-1 text-[0.72rem] text-muted">Custom positions are saved with this tree.</p>
          )}
        </div>
      )}
    </Popover>
  );
}

export default function TreeControls() {
  const zoom = useStore((s) => s.transform[2]);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const treeSettingsOpen = useUiStore((s) => s.treeSettingsOpen);
  const setTreeSettingsOpen = useUiStore((s) => s.setTreeSettingsOpen);
  const openModal = useUiStore((s) => s.openModal);
  const fullscreen = useUiStore((s) => s.fullscreen);
  const setFullscreen = useUiStore((s) => s.setFullscreen);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [setFullscreen]);

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-wrap justify-end items-center gap-0.5 popover px-1 py-1 max-w-[calc(100%-1.5rem)]" role="toolbar" aria-label="Canvas controls">
      <ToolButton icon={ZoomOut} label="Zoom out" shortcut="−" onClick={() => requestViewport('zoomOut')} />
      <button type="button" className="text-[0.72rem] tabular-nums text-muted w-10 text-center hover:text-fg" title="Reset view (0)" onClick={() => requestViewport('reset')}>
        {Math.round(zoom * 100)}%
      </button>
      <ToolButton icon={ZoomIn} label="Zoom in" shortcut="+" onClick={() => requestViewport('zoomIn')} />
      <ToolButton icon={Expand} label="Fit tree to screen" shortcut="F" onClick={() => requestViewport('fit')} />
      <ToolButton icon={LocateFixed} label="Center selected person" shortcut="." onClick={() => requestViewport('center')} />
      <ToolButton icon={fullscreen ? Minimize2 : Maximize2} label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen} pressed={fullscreen} />
      <Divider />
      <ToolButton icon={Settings2} label="Tree settings" onClick={() => setTreeSettingsOpen(!treeSettingsOpen)} pressed={treeSettingsOpen} />
      <LayoutMenu />
      <ToolButton icon={Download} label="Export" onClick={() => openModal('export')} />
      <ToolButton icon={RotateCcw} label="Reset view" shortcut="0" onClick={() => requestViewport('reset')} />
    </div>
  );
}
