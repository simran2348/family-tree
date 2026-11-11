import { useRef, useState } from 'react';
import { Upload, RefreshCw, Trash2, ImagePlus, X, Move } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toast } from '../../store/uiStore';
import { readImageFile } from '../../utils/image';
import { uid } from '../../utils/id';
import Avatar from '../ui/Avatar';

export default function ImageTab({ person }) {
  const updatePerson = useTreeStore((s) => s.updatePerson);
  const privacy = useSettingsStore((s) => s.privacy);
  const photoInput = useRef(null);
  const galleryInput = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const photo = person.photo;

  const opts = { maxSize: privacy.imageMaxSize, quality: privacy.imageQuality };

  const setPhotoFromFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await readImageFile(file, opts);
      updatePerson(person.id, { photo: { src, x: 50, y: 50, zoom: 1 } }, photo ? 'Replace photo' : 'Add photo');
      toast('Photograph saved.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const addToGallery = async (files) => {
    setBusy(true);
    try {
      const added = [];
      for (const f of [...files].slice(0, 12)) {
        added.push({ id: uid('img'), src: await readImageFile(f, { ...opts, maxSize: Math.max(opts.maxSize, 1024) }), caption: '' });
      }
      updatePerson(person.id, { gallery: [...(person.gallery || []), ...added] }, 'Add photos');
      toast(`${added.length} photo${added.length === 1 ? '' : 's'} added to the gallery.`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const setCrop = (patch) => updatePerson(person.id, { photo: { ...photo, ...patch } }, 'Adjust photo');

  return (
    <div className="space-y-5">
      <section>
        <h4 className="label">Profile photograph</h4>
        <div
          className={`flex items-center gap-4 p-3 rounded-[var(--radius)] border border-dashed transition-colors ${dragOver ? 'border-accent bg-accent/5' : 'border-line'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); setPhotoFromFile(e.dataTransfer.files?.[0]); }}
        >
          <Avatar person={person} size={96} shape="rounded" />
          <div className="flex flex-col gap-1.5 min-w-0">
            {!photo?.src ? (
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => photoInput.current?.click()}>
                <Upload size={14} /> Upload photo
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => photoInput.current?.click()}>
                  <RefreshCw size={14} /> Replace
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => updatePerson(person.id, { photo: null }, 'Remove photo')}>
                  <Trash2 size={14} /> Remove
                </button>
              </>
            )}
            <span className="text-[0.7rem] text-muted">or drop an image here</span>
          </div>
          <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => { setPhotoFromFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </section>

      {photo?.src && (
        <section>
          <h4 className="label flex items-center gap-1"><Move size={12} /> Position &amp; crop</h4>
          <div className="space-y-2.5 text-[0.8rem]">
            {[
              { key: 'zoom', label: 'Zoom', min: 1, max: 3, step: 0.05, fmt: (v) => `${v.toFixed(2)}×` },
              { key: 'x', label: 'Horizontal', min: 0, max: 100, step: 1, fmt: (v) => `${v}%` },
              { key: 'y', label: 'Vertical', min: 0, max: 100, step: 1, fmt: (v) => `${v}%` },
            ].map((s) => (
              <label key={s.key} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-2">
                <span className="text-muted">{s.label}</span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={photo[s.key] ?? (s.key === 'zoom' ? 1 : 50)} onChange={(e) => setCrop({ [s.key]: Number(e.target.value) })} />
                <span className="text-right tabular-nums text-muted">{s.fmt(photo[s.key] ?? (s.key === 'zoom' ? 1 : 50))}</span>
              </label>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-muted text-[0.75rem]">Preview</span>
              <Avatar person={person} size={48} shape="circle" />
              <Avatar person={person} size={40} shape="rounded" />
              <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={() => setCrop({ x: 50, y: 50, zoom: 1 })}>Reset</button>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="label !mb-0">Family photographs</h4>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => galleryInput.current?.click()}>
            <ImagePlus size={14} /> Add
          </button>
          <input ref={galleryInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addToGallery(e.target.files); e.target.value = ''; }} />
        </div>
        {person.gallery?.length ? (
          <div className="grid grid-cols-3 gap-1.5">
            {person.gallery.map((img) => (
              <figure key={img.id} className="group relative aspect-square overflow-hidden rounded-[calc(var(--radius)*0.8)] border border-line bg-surface-alt">
                <img src={img.src} alt={img.caption || 'Family photograph'} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-black/45 p-1">
                  <input
                    className="w-full bg-transparent text-white text-[0.66rem] placeholder:text-white/70 outline-none"
                    placeholder="Caption"
                    defaultValue={img.caption}
                    onBlur={(e) => e.target.value !== img.caption && updatePerson(person.id, { gallery: person.gallery.map((g) => (g.id === img.id ? { ...g, caption: e.target.value } : g)) }, 'Edit caption')}
                  />
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" className="h-5 w-5 rounded bg-black/50 text-white flex items-center justify-center" title="Use as profile photo"
                    onClick={() => updatePerson(person.id, { photo: { src: img.src, x: 50, y: 50, zoom: 1 } }, 'Set profile photo')}>
                    <Upload size={10} />
                  </button>
                  <button type="button" className="h-5 w-5 rounded bg-black/50 text-white flex items-center justify-center" aria-label="Remove photo"
                    onClick={() => updatePerson(person.id, { gallery: person.gallery.filter((g) => g.id !== img.id) }, 'Remove photo')}>
                    <X size={11} />
                  </button>
                </div>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-[0.78rem] text-muted">Keep old portraits, documents and family snapshots here.</p>
        )}
      </section>
    </div>
  );
}
