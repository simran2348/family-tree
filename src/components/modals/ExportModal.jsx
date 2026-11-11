import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Download, FileImage, FileJson, FileText, FileCode2, Image as ImageIcon, Loader2, GitBranch } from 'lucide-react';
import Modal from '../ui/Modal';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useResolvedTheme } from '../../hooks/useTheme';
import { getExportIds, subsetTree, captureTree, waitForRender, addTitleBanner, toPdf } from '../../services/exportService';
import { exportGedcom } from '../../utils/gedcom';
import { downloadDataUrl, downloadText, safeFilename } from '../../utils/download';
import { displayName } from '../../utils/person';
import { formatDate, todayISO } from '../../utils/dates';

const FORMATS = [
  { id: 'png', label: 'PNG', desc: 'High quality image', icon: FileImage },
  { id: 'jpeg', label: 'JPEG', desc: 'Smaller image file', icon: ImageIcon },
  { id: 'svg', label: 'SVG', desc: 'Scalable vector', icon: FileCode2 },
  { id: 'pdf', label: 'PDF', desc: 'Print-ready document', icon: FileText },
  { id: 'json', label: 'JSON', desc: 'Complete editable data', icon: FileJson },
  { id: 'ged', label: 'GEDCOM', desc: 'For other genealogy apps', icon: GitBranch },
];

export default function ExportModal() {
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const selectedId = useTreeStore((s) => s.selectedId);
  const multiSelect = useTreeStore((s) => s.multiSelect);
  const closeModal = useUiStore((s) => s.closeModal);
  const setExportFilter = useUiStore((s) => s.setExportFilter);
  const setExporting = useUiStore((s) => s.setExporting);
  const appearance = useSettingsStore((s) => s.appearance);
  const canvas = useSettingsStore((s) => s.canvas);
  const general = useSettingsStore((s) => s.general);
  const { colors } = useResolvedTheme();
  const rf = useReactFlow();

  const [format, setFormat] = useState('png');
  const [scope, setScope] = useState('all');
  const [resolution, setResolution] = useState(2);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [filename, setFilename] = useState(safeFilename(tree.name));
  const [busy, setBusy] = useState(false);

  const selected = tree.people[selectedId];
  const isImage = ['png', 'jpeg', 'svg', 'pdf'].includes(format);
  const scopes = [
    { id: 'all', label: 'Entire family tree' },
    { id: 'branch', label: 'Selected branch', hint: selected ? `${displayName(selected)}, partners & descendants` : 'Select a person first', disabled: !selected },
    { id: 'ancestors', label: 'Ancestors only', hint: selected ? `${displayName(selected)} and forebears` : '', disabled: !selected },
    { id: 'descendants', label: 'Descendants only', hint: selected ? `${displayName(selected)} and descendants` : '', disabled: !selected },
    { id: 'selection', label: 'Selected individuals', hint: multiSelect.length ? `${multiSelect.length} people (shift-click to select)` : 'Shift-click cards to select people', disabled: !multiSelect.length },
  ];

  const run = async () => {
    setBusy(true);
    const ids = getExportIds(tree, scope, { selectedId, multiSelect });
    const name = filename || 'family-tree';
    try {
      if (ids && !ids.size) throw new Error('Nothing selected to export.');
      if (format === 'json') {
        const data = subsetTree(tree, ids);
        downloadText(JSON.stringify({ app: 'family-tree-builder', type: 'tree', version: 1, exportedAt: new Date().toISOString(), tree: data }, null, 2), `${name}.json`);
      } else if (format === 'ged') {
        downloadText(exportGedcom(subsetTree(tree, ids)), `${name}.ged`, 'text/plain');
      } else {
        setExporting(true);
        setExportFilter(ids);
        await waitForRender();
        const background = canvas.background || colors.canvasBg;
        const captureFormat = format === 'pdf' ? 'png' : format;
        const shot = await captureTree(rf, { format: captureFormat, pixelRatio: resolution, background, transparent, appearance });
        let { dataUrl } = shot;
        const subtitle = `${ids ? ids.size : Object.keys(tree.people).length} people · ${formatDate(todayISO(), general.dateFormat, general.locale)}`;
        if (includeTitle && format !== 'svg') {
          dataUrl = await addTitleBanner(dataUrl, {
            title: tree.name, subtitle, background: transparent && format === 'png' ? null : background,
            color: colors.text, muted: colors.muted, headingFont: appearance.headingFont, format: captureFormat,
          });
        }
        if (format === 'pdf') {
          const pdf = await toPdf(dataUrl, { title: tree.name, width: shot.width, height: shot.height });
          pdf.save(`${name}.pdf`);
        } else {
          downloadDataUrl(dataUrl, `${name}.${format === 'jpeg' ? 'jpg' : format}`);
        }
      }
      toast('Export complete.', 'success');
      closeModal();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Export failed.', 'error');
    } finally {
      setExportFilter(null);
      setExporting(false);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Export family tree"
      subtitle="Save an image, a printable PDF or your complete data."
      icon={Download}
      onClose={closeModal}
      width="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export {FORMATS.find((f) => f.id === format).label}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="label">Format</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup">
            {FORMATS.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={format === f.id} onClick={() => setFormat(f.id)}
                className={`flex items-center gap-2.5 p-2.5 text-left rounded-[var(--radius)] border transition-colors ${format === f.id ? 'border-accent bg-accent/8' : 'border-line hover:bg-surface-alt'}`}>
                <f.icon size={18} className={format === f.id ? 'text-accent' : 'text-muted'} />
                <span>
                  <span className="block text-[0.85rem] font-medium">{f.label}</span>
                  <span className="block text-[0.7rem] text-muted">{f.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label">What to export</h3>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {scopes.map((s) => (
              <label key={s.id} className={`flex items-start gap-2 p-2 rounded-[var(--radius)] ${s.disabled ? 'opacity-50' : 'hover:bg-surface-alt cursor-pointer'}`}>
                <input type="radio" name="scope" className="mt-1" checked={scope === s.id} disabled={s.disabled} onChange={() => setScope(s.id)} />
                <span>
                  <span className="block text-[0.85rem]">{s.label}</span>
                  {s.hint && <span className="block text-[0.7rem] text-muted">{s.hint}</span>}
                </span>
              </label>
            ))}
          </div>
        </section>

        {isImage && (
          <section className="grid sm:grid-cols-2 gap-4">
            {format !== 'svg' && (
              <div>
                <h3 className="label">Resolution</h3>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((r) => (
                    <button key={r} type="button" onClick={() => setResolution(r)} aria-pressed={resolution === r}
                      className={`btn btn-sm flex-1 ${resolution === r ? 'btn-primary' : 'btn-outline'}`}>{r}×</button>
                  ))}
                </div>
                <p className="text-[0.7rem] text-muted mt-1">{resolution >= 3 ? 'High resolution — ideal for printing.' : 'Good for screens and sharing.'}</p>
              </div>
            )}
            <div className="space-y-2 text-[0.84rem]">
              <h3 className="label">Options</h3>
              {format !== 'svg' && (
                <label className="flex items-center gap-2"><input type="checkbox" checked={includeTitle} onChange={(e) => setIncludeTitle(e.target.checked)} /> Include tree title</label>
              )}
              {format === 'png' && (
                <label className="flex items-center gap-2"><input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} /> Transparent background</label>
              )}
            </div>
          </section>
        )}

        <section>
          <label className="label" htmlFor="export-name">File name</label>
          <input id="export-name" className="input" value={filename} onChange={(e) => setFilename(e.target.value.replace(/[^a-z0-9-_ ]/gi, ''))} />
        </section>
      </div>
    </Modal>
  );
}
