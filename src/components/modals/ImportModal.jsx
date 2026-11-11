import { useRef, useState } from 'react';
import { Upload, FileUp, Loader2, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { readTextFile } from '../../utils/download';
import { parseGedcom } from '../../utils/gedcom';
import { normalizeTree } from '../../services/relativeService';

async function parseFile(file) {
  const text = await readTextFile(file);
  const name = file.name.replace(/\.[^.]+$/, '');
  if (/\.ged(com)?$/i.test(file.name) || /^\s*0\s+HEAD/.test(text)) {
    return { kind: 'tree', tree: parseGedcom(text, name.replace(/[-_]/g, ' ')), source: 'GEDCOM' };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON or GEDCOM.');
  }
  if (Array.isArray(data.trees)) return { kind: 'backup', backup: data, source: 'Backup' };
  if (data.tree) return { kind: 'tree', tree: data.tree, source: 'JSON' };
  if (data.people) return { kind: 'tree', tree: data, source: 'JSON' };
  throw new Error('No family tree data was found in this file.');
}

export default function ImportModal({ initialMode } = {}) {
  const closeModal = useUiStore((s) => s.closeModal);
  const addImportedTree = useTreeStore((s) => s.addImportedTree);
  const deleteTree = useTreeStore((s) => s.deleteTree);
  const restoreBackup = useTreeStore((s) => s.restoreBackup);
  const activeTreeId = useTreeStore((s) => s.activeTreeId);
  const activeTree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const replaceSettings = useSettingsStore((s) => s.replaceAll);
  const fileRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(initialMode || 'new');
  const [restoreSettings, setRestoreSettings] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const result = await parseFile(file);
      if (result.kind === 'tree') result.preview = normalizeTree(result.tree);
      result.fileName = file.name;
      setParsed(result);
      setMode(result.kind === 'backup' ? 'replace-all' : initialMode === 'replace' ? 'replace' : 'new');
    } catch (err) {
      setError(err.message);
      setParsed(null);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    try {
      if (parsed.kind === 'backup') {
        restoreBackup(parsed.backup, { replace: mode === 'replace-all' });
        if (restoreSettings && parsed.backup.settings) replaceSettings(parsed.backup.settings);
        toast(`Restored ${parsed.backup.trees.length} tree${parsed.backup.trees.length === 1 ? '' : 's'}.`, 'success');
      } else {
        const old = activeTreeId;
        addImportedTree(parsed.preview);
        if (mode === 'replace') deleteTree(old);
        toast(`Imported ${Object.keys(parsed.preview.people).length} people from ${parsed.source}.`, 'success');
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const summary = parsed?.kind === 'tree'
    ? `${parsed.preview.name} — ${Object.keys(parsed.preview.people).length} people, ${parsed.preview.relationships.length} relationships`
    : parsed?.kind === 'backup'
      ? `Backup with ${parsed.backup.trees.length} tree${parsed.backup.trees.length === 1 ? '' : 's'}${parsed.backup.exportedAt ? ` from ${new Date(parsed.backup.exportedAt).toLocaleDateString()}` : ''}`
      : '';

  return (
    <Modal
      title="Import family tree"
      subtitle="JSON exports, full backups and GEDCOM (.ged) files are supported."
      icon={Upload}
      onClose={closeModal}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!parsed} onClick={confirm}><FileUp size={15} /> Import</button>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
          className={`w-full flex flex-col items-center gap-2 py-8 rounded-[var(--radius)] border-2 border-dashed transition-colors ${dragOver ? 'border-accent bg-accent/5' : 'border-line hover:bg-surface-alt'}`}
        >
          {busy ? <Loader2 className="animate-spin text-accent" /> : <Upload className="text-muted" />}
          <span className="text-[0.88rem] font-medium">Choose a file or drop it here</span>
          <span className="text-[0.72rem] text-muted">.json, .ged</span>
        </button>
        <input ref={fileRef} type="file" accept=".json,.ged,.gedcom,application/json,text/plain" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />

        {parsed && (
          <div className="rounded-[var(--radius)] border border-line p-3 space-y-3">
            <div className="flex items-start gap-2 text-[0.84rem]">
              <CheckCircle2 size={16} className="text-accent mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">{parsed.fileName}</div>
                <div className="text-muted text-[0.78rem]">{summary}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-[0.84rem]">
              {parsed.kind === 'tree' ? (
                <>
                  <label className="flex items-center gap-2"><input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} /> Add as a new tree</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace “{activeTree?.name}”</label>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-2"><input type="radio" checked={mode === 'replace-all'} onChange={() => setMode('replace-all')} /> Replace all current trees</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} /> Add alongside current trees</label>
                  {parsed.backup.settings && (
                    <label className="flex items-center gap-2"><input type="checkbox" checked={restoreSettings} onChange={(e) => setRestoreSettings(e.target.checked)} /> Also restore settings and themes</label>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {error && <div className="rounded-[var(--radius)] border border-[#b4483d]/40 bg-[#b4483d]/8 px-3 py-2 text-[0.82rem] text-[#b4483d]" role="alert">{error}</div>}
      </div>
    </Modal>
  );
}
