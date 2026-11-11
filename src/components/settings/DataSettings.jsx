import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Archive, RotateCcw, Trash2, FileJson, GitBranch, Image as ImageIcon, HardDrive } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore, toast } from '../../store/uiStore';
import { downloadText, safeFilename } from '../../utils/download';
import { exportGedcom } from '../../utils/gedcom';
import { todayISO } from '../../utils/dates';
import { SectionTitle } from '../ui/Controls';

function ActionRow({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-line/60 last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon size={18} className="text-muted mt-0.5 shrink-0" />
        <div><div className="text-[0.86rem] font-medium">{title}</div><div className="text-[0.75rem] text-muted">{desc}</div></div>
      </div>
      <div className="flex gap-2 shrink-0">{children}</div>
    </div>
  );
}

export default function DataSettings() {
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const treeCount = useTreeStore((s) => s.treeOrder.length);
  const exportBackup = useTreeStore((s) => s.exportBackup);
  const clearAllData = useTreeStore((s) => s.clearAllData);
  const resetToSample = useTreeStore((s) => s.resetToSample);
  const exportSettings = useSettingsStore((s) => s.exportSettings);
  const resetAllSettings = useSettingsStore((s) => s.resetAll);
  const openModal = useUiStore((s) => s.openModal);
  const closeSettings = useUiStore((s) => s.closeSettings);
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage(e)).catch(() => {});
  }, [tree]);

  const backup = () => {
    const data = { app: 'family-tree-builder', type: 'backup', version: 1, exportedAt: new Date().toISOString(), ...exportBackup(), settings: exportSettings() };
    downloadText(JSON.stringify(data), `family-tree-backup-${todayISO()}.json`);
    toast(`Backed up ${treeCount} tree${treeCount === 1 ? '' : 's'} and your settings.`, 'success');
  };

  const fmtBytes = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

  return (
    <div>
      <SectionTitle>Export &amp; import</SectionTitle>
      <ActionRow icon={ImageIcon} title="Export family tree" desc="PNG, JPEG, SVG, PDF, JSON or GEDCOM — whole tree or a branch.">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => { closeSettings(); navigate('/'); setTimeout(() => openModal('export'), 80); }}>
          <Download size={14} /> Export…
        </button>
      </ActionRow>
      <ActionRow icon={FileJson} title="Quick data export" desc={`Download “${tree.name}” as editable data.`}>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadText(JSON.stringify({ app: 'family-tree-builder', type: 'tree', version: 1, exportedAt: new Date().toISOString(), tree }, null, 2), `${safeFilename(tree.name)}.json`)}>JSON</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadText(exportGedcom(tree), `${safeFilename(tree.name)}.ged`, 'text/plain')}><GitBranch size={13} /> GEDCOM</button>
      </ActionRow>
      <ActionRow icon={Upload} title="Import family tree" desc="Add a tree from a JSON export or a GEDCOM (.ged) file.">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => openModal('import')}><Upload size={14} /> Import…</button>
      </ActionRow>

      <SectionTitle>Backup</SectionTitle>
      <ActionRow icon={Archive} title="Back up everything" desc="All trees, photos, themes and settings in a single file.">
        <button type="button" className="btn btn-outline btn-sm" onClick={backup}><Download size={14} /> Download backup</button>
      </ActionRow>
      <ActionRow icon={RotateCcw} title="Restore backup" desc="Replace or merge your trees from a backup file.">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => openModal('import')}><Upload size={14} /> Restore…</button>
      </ActionRow>
      {usage && (
        <ActionRow icon={HardDrive} title="Storage used" desc={`${fmtBytes(usage.usage || 0)} used on this device${usage.quota ? ` of ${fmtBytes(usage.quota)} available` : ''}.`} />
      )}

      <SectionTitle>Danger zone</SectionTitle>
      <ActionRow icon={Trash2} title="Clear application data" desc="Delete every tree and photo. Settings and themes are kept.">
        <button type="button" className="btn btn-danger btn-sm" onClick={() => openModal('confirm', {
          title: 'Clear all family tree data?', message: `All ${treeCount} tree${treeCount === 1 ? '' : 's'} and their photos will be permanently deleted. Download a backup first if you might need them.`,
          confirmLabel: 'Clear data', danger: true, requireText: 'DELETE',
          onConfirm: () => { clearAllData(); toast('All tree data cleared.', 'success'); },
        })}>Clear data</button>
      </ActionRow>
      <ActionRow icon={RotateCcw} title="Reset application" desc="Restore the sample tree and every setting to factory defaults.">
        <button type="button" className="btn btn-danger btn-sm" onClick={() => openModal('confirm', {
          title: 'Reset the application?', message: 'Every tree, photo, custom theme and preference will be removed and the sample tree restored.',
          confirmLabel: 'Reset everything', danger: true, requireText: 'RESET',
          onConfirm: () => { resetToSample(); resetAllSettings(); toast('Application reset.', 'success'); },
        })}>Reset app</button>
      </ActionRow>
    </div>
  );
}
