import { useSettingsStore } from '../../store/settingsStore';
import { Row, Toggle, Slider, SectionTitle } from '../ui/Controls';
import { ResetButton } from './TreeSettings';
import { ShortcutList } from '../modals/ShortcutsModal';

export default function AccessibilitySettings() {
  const a = useSettingsStore((s) => s.accessibility);
  const update = useSettingsStore((s) => s.update);
  const set = (patch) => update('accessibility', patch);
  return (
    <div>
      <SectionTitle action={<ResetButton sections={['accessibility']} />}>Accessibility</SectionTitle>
      <Row label="Font scaling" hint="Scales all interface text">
        <Slider value={a.fontScale} min={80} max={150} step={5} unit="%" onChange={(v) => set({ fontScale: v })} label="Font scaling" />
      </Row>
      <Row label="High contrast mode" hint="Stronger text, borders and connectors"><Toggle checked={a.highContrast} onChange={(v) => set({ highContrast: v })} label="High contrast" /></Row>
      <Row label="Reduce motion" hint="Turns off animated zooming and transitions"><Toggle checked={a.reducedMotion} onChange={(v) => set({ reducedMotion: v })} label="Reduce motion" /></Row>
      <Row label="Keyboard navigation" hint="Arrow keys move between relatives; single-key shortcuts"><Toggle checked={a.keyboardNav} onChange={(v) => set({ keyboardNav: v })} label="Keyboard navigation" /></Row>
      <SectionTitle>Keyboard shortcuts</SectionTitle>
      <ShortcutList />
    </div>
  );
}
