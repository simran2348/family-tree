import { useState } from 'react';
import { Check, Trash2, Save, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useResolvedTheme, useSystemDark } from '../../hooks/useTheme';
import { BUILT_IN_THEMES, THEME_TOKENS, HEADING_FONTS, BODY_FONTS } from '../../constants/themes';
import { uid } from '../../utils/id';
import { toast } from '../../store/uiStore';
import { Row, Toggle, Slider, Select, Segmented, SectionTitle } from '../ui/Controls';
import { ResetButton } from './TreeSettings';

function ThemeSwatch({ name, colors, active, onClick, onDelete }) {
  return (
    <div className="relative group">
      <button type="button" onClick={onClick} aria-pressed={active}
        className={`w-full text-left rounded-[var(--radius)] border overflow-hidden transition-shadow ${active ? 'border-accent ring-2 ring-accent/30' : 'border-line hover:shadow-md'}`}>
        <div className="h-3" style={{ background: colors.headerBg }} />
        <div className="h-14 relative flex" style={{ background: colors.canvasBg }}>
          <div className="w-5 h-full border-r" style={{ background: colors.sidebarBg, borderColor: colors.border }} />
          <div className="flex-1 flex items-center justify-center gap-1.5">
            <div className="h-5 w-9 rounded-sm border" style={{ background: colors.cardBg, borderColor: colors.cardBorder }} />
            <div className="h-px w-2" style={{ background: colors.connector }} />
            <div className="h-5 w-9 rounded-sm border-2" style={{ background: colors.cardBg, borderColor: colors.selected }} />
          </div>
        </div>
        <div className="px-2 py-1.5 flex items-center justify-between text-[0.76rem]" style={{ background: colors.surface, color: colors.text }}>
          <span className="truncate">{name}</span>
          {active && <Check size={13} style={{ color: colors.accent }} />}
        </div>
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} className="absolute top-4 right-1 h-6 w-6 rounded bg-black/45 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center" aria-label={`Delete ${name}`}>
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

export default function AppearanceSettings() {
  const ap = useSettingsStore((s) => s.appearance);
  const update = useSettingsStore((s) => s.update);
  const { colors, dark } = useResolvedTheme();
  const systemDark = useSystemDark();
  const [themeName, setThemeName] = useState('');
  const set = (patch) => update('appearance', patch);

  const chooseBuiltIn = (t) => {
    if (t.dark) set({ darkTheme: t.id, mode: ap.mode === 'system' && systemDark ? 'system' : 'dark', activeCustomId: null });
    else set({ lightTheme: t.id, mode: ap.mode === 'system' && !systemDark ? 'system' : 'light', activeCustomId: null });
  };
  const isActiveBuiltIn = (t) => ap.mode !== 'custom' && (dark ? ap.darkTheme === t.id : ap.lightTheme === t.id);

  const editColor = (key, value) => set({ mode: 'custom', customColors: { ...colors, ...(ap.mode === 'custom' ? ap.customColors : {}), [key]: value } });

  const saveTheme = () => {
    const name = themeName.trim() || `Custom theme ${ap.customThemes.length + 1}`;
    const theme = { id: uid('theme'), name, colors: { ...colors } };
    set({ customThemes: [...ap.customThemes, theme], activeCustomId: theme.id, mode: 'custom', customColors: theme.colors });
    setThemeName('');
    toast(`Saved “${name}”.`, 'success');
  };
  const updateTheme = () => {
    set({ customThemes: ap.customThemes.map((t) => (t.id === ap.activeCustomId ? { ...t, colors: { ...colors } } : t)) });
    toast('Theme updated.', 'success');
  };
  const activeCustom = ap.customThemes.find((t) => t.id === ap.activeCustomId);

  return (
    <div>
      <SectionTitle action={<ResetButton sections={['appearance']} />}>Theme</SectionTitle>
      <Row label="Colour mode">
        <Segmented value={ap.mode} onChange={(v) => set({ mode: v, customColors: v === 'custom' ? ap.customColors || colors : ap.customColors })} label="Colour mode"
          options={[{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }, { id: 'custom', label: 'Custom', icon: Palette }]} />
      </Row>
      <p className="text-[0.74rem] text-muted -mt-1 mb-2">
        Light theme: <b>{BUILT_IN_THEMES.find((t) => t.id === ap.lightTheme)?.name}</b> · Dark theme: <b>{BUILT_IN_THEMES.find((t) => t.id === ap.darkTheme)?.name}</b>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2">
        {BUILT_IN_THEMES.map((t) => (
          <ThemeSwatch key={t.id} name={t.name} colors={t.colors} active={isActiveBuiltIn(t)} onClick={() => chooseBuiltIn(t)} />
        ))}
      </div>

      {ap.customThemes.length > 0 && (
        <>
          <h4 className="label mt-3">Your themes</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ap.customThemes.map((t) => (
              <ThemeSwatch key={t.id} name={t.name} colors={t.colors} active={ap.mode === 'custom' && ap.activeCustomId === t.id}
                onClick={() => set({ mode: 'custom', activeCustomId: t.id, customColors: t.colors })}
                onDelete={() => set({ customThemes: ap.customThemes.filter((x) => x.id !== t.id), activeCustomId: ap.activeCustomId === t.id ? null : ap.activeCustomId })} />
            ))}
          </div>
        </>
      )}

      <SectionTitle>Custom colours</SectionTitle>
      <p className="text-[0.75rem] text-muted mb-2">Editing any colour switches to Custom mode, starting from the current theme.</p>
      <div className="grid sm:grid-cols-2 gap-x-5">
        {THEME_TOKENS.map((t) => (
          <label key={t.key} className="flex items-center justify-between gap-2 py-1.5 text-[0.82rem] border-b border-line/50">
            <span>{t.label}</span>
            <span className="flex items-center gap-2">
              <code className="text-[0.68rem] text-muted uppercase">{colors[t.key]}</code>
              <input type="color" value={colors[t.key]} onChange={(e) => editColor(t.key, e.target.value)} aria-label={t.label} />
            </span>
          </label>
        ))}
        <label className="flex items-center justify-between gap-2 py-1.5 text-[0.82rem] border-b border-line/50">
          <span>Grid opacity</span>
          <span className="w-36"><Slider value={Math.round((colors.gridOpacity ?? 0.45) * 100)} min={0} max={100} unit="%" onChange={(v) => editColor('gridOpacity', v / 100)} label="Grid opacity" /></span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input className="input !w-52" placeholder="Theme name" value={themeName} onChange={(e) => setThemeName(e.target.value)} />
        <button type="button" className="btn btn-outline btn-sm" onClick={saveTheme}><Save size={13} /> Save as new theme</button>
        {activeCustom && ap.mode === 'custom' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={updateTheme}>Update “{activeCustom.name}”</button>
        )}
      </div>

      <SectionTitle>Typography</SectionTitle>
      <Row label="Heading font"><Select value={ap.headingFont} onChange={(v) => set({ headingFont: v })} options={HEADING_FONTS} label="Heading font" /></Row>
      <Row label="Body font"><Select value={ap.bodyFont} onChange={(v) => set({ bodyFont: v })} options={BODY_FONTS} label="Body font" /></Row>
      <Row label="Base font size"><Slider value={ap.fontSize} min={12} max={18} onChange={(v) => set({ fontSize: v })} unit="px" label="Font size" /></Row>
      <div className="mt-1 p-3 rounded-[var(--radius)] border border-line bg-surface-alt/40">
        <div className="font-heading text-xl font-semibold">Margaret Ellis Hartley</div>
        <div className="text-[0.85rem] text-muted">Born 30 Aug 1921 in Leeds · Schoolteacher for 31 years</div>
      </div>

      <SectionTitle>Interface</SectionTitle>
      <Row label="Corner radius"><Slider value={ap.radius} min={0} max={16} onChange={(v) => set({ radius: v })} unit="px" label="Corner radius" /></Row>
      <Row label="UI density">
        <Segmented value={ap.density} onChange={(v) => set({ density: v })} options={[{ id: 'compact', label: 'Compact' }, { id: 'comfortable', label: 'Comfortable' }, { id: 'spacious', label: 'Spacious' }]} label="Density" />
      </Row>
      <Row label="Animations" hint="Smooth zooming, panels and transitions"><Toggle checked={ap.animations} onChange={(v) => set({ animations: v })} label="Animations" /></Row>
    </div>
  );
}
