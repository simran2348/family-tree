// Tree customisation sections. Used both in the canvas drawer and the full Settings dialog.
import { RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTreeStore, useActiveTree } from '../../store/familyTreeStore';
import { useUiStore } from '../../store/uiStore';
import { useResolvedTheme } from '../../hooks/useTheme';
import { LAYOUT_PRESETS } from '../../constants/defaults';
import { Row, Toggle, Slider, Select, Segmented, ColorField, SectionTitle } from '../ui/Controls';

function ResetButton({ sections, label = 'Reset' }) {
  const resetSections = useSettingsStore((s) => s.resetSections);
  return (
    <button type="button" className="btn btn-ghost btn-sm !h-7 text-muted" onClick={() => resetSections(sections)} title="Reset to defaults">
      <RotateCcw size={12} /> {label}
    </button>
  );
}

export function LayoutSettings() {
  const layout = useSettingsStore((s) => s.layout);
  const update = useSettingsStore((s) => s.update);
  const tree = useActiveTree();
  const selectedId = useTreeStore((s) => s.selectedId);
  const setLayoutPreset = useTreeStore((s) => s.setLayoutPreset);
  const setLayoutMode = useTreeStore((s) => s.setLayoutMode);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const set = (patch) => update('layout', patch);
  const compact = tree.layoutPreset === 'compact';

  return (
    <div>
      <SectionTitle action={<ResetButton sections={['layout']} />}>Layout</SectionTitle>
      <Row label="Tree orientation" hint="Layout used for this tree" stacked>
        <Select
          className="w-full"
          value={tree.layoutPreset}
          onChange={(v) => { setLayoutPreset(v, ['descendants', 'ancestors', 'pedigree'].includes(v) ? selectedId || tree.homePersonId : undefined); }}
          options={LAYOUT_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
          label="Tree orientation"
        />
      </Row>
      <Row label="Automatic layout" hint={tree.layoutMode === 'manual' ? 'Cards keep the positions you dragged them to' : 'Cards are arranged for you'}>
        <Toggle checked={tree.layoutMode === 'auto'} onChange={(v) => { setLayoutMode(v ? 'auto' : 'manual'); if (v) requestViewport('fit'); }} label="Automatic layout" />
      </Row>
      <Row label="Compact mode" hint="Smaller cards and tighter spacing">
        <Toggle checked={compact} onChange={(v) => setLayoutPreset(v ? 'compact' : 'vertical')} label="Compact mode" />
      </Row>
      <Row label="Parent alignment">
        <Segmented value={layout.alignment} onChange={(v) => set({ alignment: v })} options={[{ id: 'center', label: 'Centered' }, { id: 'left', label: 'Left' }]} label="Alignment" />
      </Row>
      <Row label="Horizontal spacing"><Slider value={layout.hSpacing} min={8} max={140} onChange={(v) => set({ hSpacing: v })} unit="px" label="Horizontal spacing" /></Row>
      <Row label="Vertical spacing"><Slider value={layout.vSpacing} min={30} max={240} onChange={(v) => set({ vSpacing: v })} unit="px" label="Vertical spacing" /></Row>
      <Row label="Partner spacing"><Slider value={layout.partnerSpacing} min={18} max={120} onChange={(v) => set({ partnerSpacing: v })} unit="px" label="Partner spacing" /></Row>
      <Row label="Branch spacing" hint="Gap between family branches"><Slider value={layout.branchSpacing} min={10} max={200} onChange={(v) => set({ branchSpacing: v })} unit="px" label="Branch spacing" /></Row>
      <Row label="Card width"><Slider value={layout.cardWidth} min={140} max={340} onChange={(v) => set({ cardWidth: v })} unit="px" label="Card width" /></Row>
      <Row label="Card height"><Slider value={layout.cardHeight} min={52} max={180} onChange={(v) => set({ cardHeight: v })} unit="px" label="Card height" /></Row>
    </div>
  );
}

export function CardSettings() {
  const card = useSettingsStore((s) => s.card);
  const update = useSettingsStore((s) => s.update);
  const set = (patch) => update('card', patch);
  const toggles = [
    ['showPhoto', 'Profile photographs'],
    ['showDates', 'Dates'],
    ['showGender', 'Gender indicator'],
    ['showRelationship', 'Relationship labels'],
    ['showLocation', 'Locations'],
    ['showDescription', 'Short descriptions'],
  ];
  return (
    <div>
      <SectionTitle action={<ResetButton sections={['card']} />}>Person cards</SectionTitle>
      <Row label="Card layout">
        <Segmented value={card.layout} onChange={(v) => set({ layout: v })} options={[{ id: 'horizontal', label: 'Side by side' }, { id: 'vertical', label: 'Stacked' }]} label="Card layout" />
      </Row>
      <div className="grid grid-cols-2 gap-x-4 py-1">
        {toggles.map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-2 py-1.5 text-[0.84rem]">
            {label}
            <Toggle checked={card[key]} onChange={(v) => set({ [key]: v })} label={label} />
          </label>
        ))}
      </div>
      {card.showDates && (
        <Row label="Date style">
          <Segmented value={card.dateStyle} onChange={(v) => set({ dateStyle: v })} options={[{ id: 'full', label: 'Full dates' }, { id: 'year', label: 'Years only' }]} label="Date style" />
        </Row>
      )}
      <Row label="Photo size"><Slider value={card.photoSize} min={24} max={96} onChange={(v) => set({ photoSize: v })} unit="px" label="Photo size" /></Row>
      <Row label="Photo shape">
        <Segmented value={card.photoShape} onChange={(v) => set({ photoShape: v })} options={[{ id: 'circle', label: 'Circle' }, { id: 'rounded', label: 'Rounded' }, { id: 'square', label: 'Square' }]} label="Photo shape" />
      </Row>
      <Row label="Corner radius"><Slider value={card.radius} min={0} max={28} onChange={(v) => set({ radius: v })} unit="px" label="Corner radius" /></Row>
      <Row label="Border width"><Slider value={card.borderWidth} min={0} max={4} step={0.5} onChange={(v) => set({ borderWidth: v })} unit="px" label="Border width" /></Row>
      <Row label="Shadow">
        <Segmented value={card.shadow} onChange={(v) => set({ shadow: v })} options={['none', 'sm', 'md', 'lg'].map((id) => ({ id, label: id === 'none' ? 'None' : id.toUpperCase() }))} label="Shadow" />
      </Row>
      <Row label="Background" stacked>
        <Segmented value={card.background} onChange={(v) => set({ background: v })} options={[{ id: 'theme', label: 'Theme' }, { id: 'gender', label: 'By gender' }, { id: 'accent', label: 'Tinted' }, { id: 'transparent', label: 'Clear' }]} label="Card background" />
      </Row>
      <Row label="Selected card">
        <Segmented value={card.selectedStyle} onChange={(v) => set({ selectedStyle: v })} options={[{ id: 'ring', label: 'Ring' }, { id: 'thick', label: 'Border' }, { id: 'glow', label: 'Glow' }]} label="Selected appearance" />
      </Row>
    </div>
  );
}

export function ConnectorSettings() {
  const c = useSettingsStore((s) => s.connector);
  const update = useSettingsStore((s) => s.update);
  const { colors } = useResolvedTheme();
  const set = (patch) => update('connector', patch);
  return (
    <div>
      <SectionTitle action={<ResetButton sections={['connector']} />}>Connections</SectionTitle>
      <Row label="Connector style">
        <Segmented value={c.style} onChange={(v) => set({ style: v })} options={[{ id: 'orthogonal', label: 'Orthogonal' }, { id: 'curved', label: 'Curved' }, { id: 'straight', label: 'Straight' }]} label="Connector style" />
      </Row>
      {c.style === 'orthogonal' && (
        <Row label="Corner rounding"><Slider value={c.cornerRadius} min={0} max={24} onChange={(v) => set({ cornerRadius: v })} unit="px" label="Corner rounding" /></Row>
      )}
      <Row label="Thickness"><Slider value={c.thickness} min={0.5} max={5} step={0.25} onChange={(v) => set({ thickness: v })} unit="px" label="Thickness" /></Row>
      <Row label="Dashed lines"><Toggle checked={c.dashed} onChange={(v) => set({ dashed: v })} label="Dashed lines" /></Row>
      <Row label="Connector colour"><ColorField value={c.color} fallback={colors.connector} onChange={(v) => set({ color: v })} allowReset label="Connector colour" /></Row>
      <Row label="Partnership colour"><ColorField value={c.partnerColor} fallback={c.color || colors.connector} onChange={(v) => set({ partnerColor: v })} allowReset label="Partnership colour" /></Row>
      <Row label="Marriage indicators" hint="Rings on partnership lines"><Toggle checked={c.marriageIndicator} onChange={(v) => set({ marriageIndicator: v })} label="Marriage indicators" /></Row>
      <Row label="Relationship labels" hint="Marriage years, divorces and adoptions"><Toggle checked={c.showLabels} onChange={(v) => set({ showLabels: v })} label="Relationship labels" /></Row>
      <p className="text-[0.72rem] text-muted mt-1">Adoptive, step and foster links are always drawn dotted.</p>
    </div>
  );
}

export function CanvasSettings() {
  const cv = useSettingsStore((s) => s.canvas);
  const update = useSettingsStore((s) => s.update);
  const { colors } = useResolvedTheme();
  const set = (patch) => update('canvas', patch);
  return (
    <div>
      <SectionTitle action={<ResetButton sections={['canvas']} />}>Canvas</SectionTitle>
      <Row label="Show grid"><Toggle checked={cv.showGrid} onChange={(v) => set({ showGrid: v })} label="Show grid" /></Row>
      <Row label="Grid size"><Slider value={cv.gridSize} min={8} max={80} step={2} onChange={(v) => set({ gridSize: v })} unit="px" label="Grid size" /></Row>
      <Row label="Grid opacity"><Slider value={Math.round((cv.gridOpacity ?? colors.gridOpacity ?? 0.45) * 100)} min={0} max={100} onChange={(v) => set({ gridOpacity: v / 100 })} unit="%" label="Grid opacity" /></Row>
      <Row label="Grid colour"><ColorField value={cv.gridColor} fallback={colors.gridColor} onChange={(v) => set({ gridColor: v })} allowReset label="Grid colour" /></Row>
      <Row label="Canvas background"><ColorField value={cv.background} fallback={colors.canvasBg} onChange={(v) => set({ background: v })} allowReset label="Canvas background" /></Row>
      <Row label="Fit padding" hint="Space around the tree when fitting"><Slider value={Math.round(cv.padding * 100)} min={0} max={60} onChange={(v) => set({ padding: v / 100 })} unit="%" label="Fit padding" /></Row>
      <Row label="Snap to grid" hint="While dragging cards"><Toggle checked={cv.snapToGrid} onChange={(v) => set({ snapToGrid: v })} label="Snap to grid" /></Row>
      <Row label="Show minimap"><Toggle checked={cv.showMinimap} onChange={(v) => set({ showMinimap: v })} label="Show minimap" /></Row>
      <Row label="Show navigation controls" hint="Zoom buttons in the corner"><Toggle checked={cv.showControls} onChange={(v) => set({ showControls: v })} label="Show navigation controls" /></Row>
    </div>
  );
}

export function TreeSettingsAll() {
  return (
    <div className="space-y-2">
      <LayoutSettings />
      <CardSettings />
      <ConnectorSettings />
      <CanvasSettings />
    </div>
  );
}

export { ResetButton };
