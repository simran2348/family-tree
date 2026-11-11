import { useSettingsStore } from '../../store/settingsStore';
import { useTreeStore, useActiveTree } from '../../store/familyTreeStore';
import { toast } from '../../store/uiStore';
import { LAYOUT_PRESETS, DATE_FORMATS, LOCALES } from '../../constants/defaults';
import { formatDate } from '../../utils/dates';
import { Row, Toggle, Select, Slider, SectionTitle } from '../ui/Controls';
import { ResetButton } from './TreeSettings';

export function GeneralSettings() {
  const g = useSettingsStore((s) => s.general);
  const update = useSettingsStore((s) => s.update);
  const set = (patch) => update('general', patch);
  return (
    <div>
      <SectionTitle action={<ResetButton sections={['general']} />}>General</SectionTitle>
      <Row label="Default landing screen" hint="Shown when the app opens">
        <Select value={g.landing} onChange={(v) => set({ landing: v })} label="Landing screen"
          options={[{ id: 'tree', label: 'Family tree' }, { id: 'timeline', label: 'Timeline' }, { id: 'statistics', label: 'Statistics' }]} />
      </Row>
      <Row label="Language & region" hint="Controls month names and number formats">
        <Select value={g.locale} onChange={(v) => set({ locale: v })} options={LOCALES} label="Language" />
      </Row>
      <Row label="Date format">
        <Select value={g.dateFormat} onChange={(v) => set({ dateFormat: v })} label="Date format"
          options={DATE_FORMATS.map((f) => ({ id: f.id, label: formatDate('1952-03-04', f.id, g.locale) }))} />
      </Row>
      <Row label="First day of the week" hint="Used for “this week” in the timeline">
        <Select value={String(g.weekStart)} onChange={(v) => set({ weekStart: Number(v) })} label="First day of week"
          options={[{ id: '1', label: 'Monday' }, { id: '0', label: 'Sunday' }, { id: '6', label: 'Saturday' }]} />
      </Row>
      <Row label="Confirm before deleting" hint="Ask before removing people or trees">
        <Toggle checked={g.confirmDeletes} onChange={(v) => set({ confirmDeletes: v })} label="Confirm deletes" />
      </Row>
    </div>
  );
}

export function TreePreferences() {
  const g = useSettingsStore((s) => s.general);
  const card = useSettingsStore((s) => s.card);
  const canvas = useSettingsStore((s) => s.canvas);
  const update = useSettingsStore((s) => s.update);
  const tree = useActiveTree();
  const setLayoutPreset = useTreeStore((s) => s.setLayoutPreset);
  return (
    <div>
      <SectionTitle>Tree preferences</SectionTitle>
      <Row label="Default layout for new trees">
        <div className="flex items-center gap-2">
          <Select value={g.defaultLayout} onChange={(v) => update('general', { defaultLayout: v })} options={LAYOUT_PRESETS.map((p) => ({ id: p.id, label: p.label }))} label="Default layout" />
          {tree.layoutPreset !== g.defaultLayout && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLayoutPreset(g.defaultLayout, tree.homePersonId); toast('Applied to this tree.', 'success'); }}>Apply now</button>
          )}
        </div>
      </Row>
      <Row label="Relationship labels relative to" hint="Whose perspective cards are labelled from">
        <Select value={g.relativeTo} onChange={(v) => update('general', { relativeTo: v })} label="Relative to"
          options={[{ id: 'home', label: 'Home person' }, { id: 'selected', label: 'Selected person' }]} />
      </Row>
      <Row label="Grid snapping"><Toggle checked={canvas.snapToGrid} onChange={(v) => update('canvas', { snapToGrid: v })} label="Grid snapping" /></Row>
      <Row label="Default zoom level" hint="Used by Reset view">
        <Slider value={Math.round(canvas.defaultZoom * 100)} min={30} max={200} step={5} unit="%" onChange={(v) => update('canvas', { defaultZoom: v / 100 })} label="Default zoom" />
      </Row>
      <h4 className="label mt-4">Default card information</h4>
      <div className="grid grid-cols-2 gap-x-4">
        {[['showPhoto', 'Photographs'], ['showDates', 'Dates'], ['showGender', 'Gender'], ['showRelationship', 'Relationship'], ['showLocation', 'Location'], ['showDescription', 'Description']].map(([k, l]) => (
          <label key={k} className="flex items-center justify-between py-1.5 text-[0.84rem]">{l}<Toggle checked={card[k]} onChange={(v) => update('card', { [k]: v })} label={l} /></label>
        ))}
      </div>
    </div>
  );
}
