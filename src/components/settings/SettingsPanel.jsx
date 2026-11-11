import { useEffect } from 'react';
import { X, SlidersHorizontal, Network, LayoutTemplate, IdCard, Spline, Grid3x3, Palette, Database, Shield, Accessibility } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { GeneralSettings, TreePreferences } from './GeneralSettings';
import { LayoutSettings, CardSettings, ConnectorSettings, CanvasSettings } from './TreeSettings';
import AppearanceSettings from './AppearanceSettings';
import DataSettings from './DataSettings';
import PrivacySettings from './PrivacySettings';
import AccessibilitySettings from './AccessibilitySettings';

const SECTIONS = [
  { id: 'general', label: 'General', icon: SlidersHorizontal, C: GeneralSettings },
  { id: 'tree', label: 'Tree preferences', icon: Network, C: TreePreferences },
  { id: 'layout', label: 'Layout', icon: LayoutTemplate, C: LayoutSettings },
  { id: 'cards', label: 'Person cards', icon: IdCard, C: CardSettings },
  { id: 'connections', label: 'Connections', icon: Spline, C: ConnectorSettings },
  { id: 'canvas', label: 'Canvas', icon: Grid3x3, C: CanvasSettings },
  { id: 'appearance', label: 'Appearance', icon: Palette, C: AppearanceSettings },
  { id: 'data', label: 'Data management', icon: Database, C: DataSettings },
  { id: 'privacy', label: 'Privacy', icon: Shield, C: PrivacySettings },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, C: AccessibilitySettings },
];

export default function SettingsPanel() {
  const { open, section } = useUiStore((s) => s.settings);
  const close = useUiStore((s) => s.closeSettings);
  const setSection = useUiStore((s) => s.setSettingsSection);
  const modalOpen = useUiStore((s) => Boolean(s.modal));

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !useUiStore.getState().modal) close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  const active = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const Active = active.C;

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center sm:p-6 anim-fade ${modalOpen ? 'pointer-events-none' : ''}`}>
      <div className="absolute inset-0 bg-black/30" onMouseDown={close} />
      <div role="dialog" aria-modal="true" aria-label="Settings"
        className="relative w-full max-w-5xl h-full sm:h-[min(52rem,90vh)] flex flex-col sm:flex-row bg-surface border border-line sm:rounded-[calc(var(--radius)*1.4)] shadow-2xl overflow-hidden anim-pop">
        <nav className="sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-line bg-surface-alt/40 flex sm:flex-col overflow-x-auto sm:overflow-y-auto scroll-thin p-2 gap-0.5" aria-label="Settings sections">
          <div className="hidden sm:block px-2.5 pt-2 pb-3 font-heading text-2xl font-semibold">Settings</div>
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)} aria-current={s.id === active.id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[0.84rem] whitespace-nowrap transition-colors ${s.id === active.id ? 'bg-accent/12 text-accent font-medium' : 'text-fg/80 hover:bg-surface-alt'}`}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-end px-3 pt-2 absolute right-0 top-0 z-10">
            <button type="button" className="icon-btn bg-surface" onClick={close} aria-label="Close settings"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin px-5 sm:px-8 py-6">
            <div className="max-w-2xl"><Active /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
