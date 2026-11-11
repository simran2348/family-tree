import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, UserPlus, Heart, Baby, Upload, AlertTriangle, Link2, Search, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Field, DateInput, dateRules, deathRules } from '../person/fields';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { GENDERS, PARTNER_TYPES, PARENT_TYPES } from '../../constants/defaults';
import { displayName, fullName, lifespan } from '../../utils/person';
import { getParents, getPartners, getBiologicalParents, validateRelationship } from '../../utils/graph';
import { findPossibleDuplicates } from '../../utils/duplicates';
import { readImageFile } from '../../utils/image';

const META = {
  parent: { title: 'Add a parent', icon: Users, verb: 'parent' },
  sibling: { title: 'Add a sibling', icon: UserPlus, verb: 'sibling' },
  partner: { title: 'Add a partner', icon: Heart, verb: 'partner' },
  child: { title: 'Add a child', icon: Baby, verb: 'child' },
  none: { title: 'Add a person', icon: UserPlus, verb: 'person' },
};

function defaultsFor(kind, anchor, tree) {
  const parents = anchor ? getParents(tree, anchor.id).map((id) => tree.people[id]) : [];
  const hasFather = parents.some((p) => p.gender === 'male');
  const hasMother = parents.some((p) => p.gender === 'female');
  let gender = 'unknown';
  let lastName = '';
  if (kind === 'parent') {
    gender = !hasFather ? 'male' : !hasMother ? 'female' : 'unknown';
    lastName = gender === 'male' ? anchor?.birthSurname || anchor?.lastName || '' : '';
  } else if (kind === 'partner') {
    gender = anchor?.gender === 'male' ? 'female' : anchor?.gender === 'female' ? 'male' : 'unknown';
  } else if (kind === 'child' || kind === 'sibling') {
    lastName = kind === 'sibling' ? anchor?.birthSurname || anchor?.lastName || '' : anchor?.lastName || '';
  }
  return {
    firstName: '', middleName: '', lastName, birthSurname: '', gender, birthDate: '', deathDate: '', isLiving: true,
    birthPlace: '', location: '',
    subtype: 'biological', status: 'married', startDate: '',
    otherParentId: kind === 'child' && anchor ? getPartners(tree, anchor.id)[0] || '' : '',
    linkCoParent: true,
    siblingType: 'full', halfParentId: anchor ? getParents(tree, anchor.id)[0] || '' : '',
  };
}

export default function AddPersonModal({ kind = 'none', anchorId }) {
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const addRelative = useTreeStore((s) => s.addRelative);
  const closeModal = useUiStore((s) => s.closeModal);
  const requestViewport = useUiStore((s) => s.requestViewport);
  const privacy = useSettingsStore((s) => s.privacy);
  const anchor = tree.people[anchorId];
  const meta = META[kind] || META.none;
  const [mode, setMode] = useState('new');
  const [existingId, setExistingId] = useState('');
  const [existingQuery, setExistingQuery] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm({
    defaultValues: defaultsFor(kind, anchor, tree),
    mode: 'onBlur',
  });

  const [firstName, lastName, birthDate, siblingType, subtype] = watch(['firstName', 'lastName', 'birthDate', 'siblingType', 'subtype']);
  const duplicates = useMemo(
    () => (mode === 'new' && firstName?.trim().length > 1 ? findPossibleDuplicates(tree, { firstName, lastName, birthDate }) : []),
    [tree, firstName, lastName, birthDate, mode],
  );

  const anchorParents = anchor ? getParents(tree, anchor.id) : [];
  const anchorPartners = anchor ? getPartners(tree, anchor.id) : [];
  const bioParentCount = anchor ? getBiologicalParents(tree, anchor.id).length : 0;

  // Candidates for "link existing" – filtered to those that would make a valid relationship.
  const candidates = useMemo(() => {
    if (kind === 'none') return [];
    const q = existingQuery.trim().toLowerCase();
    return Object.values(tree.people)
      .filter((p) => p.id !== anchorId)
      .filter((p) => !q || fullName(p).toLowerCase().includes(q))
      .map((p) => {
        let rel;
        if (kind === 'parent') rel = { type: 'parent', source: p.id, target: anchorId, subtype: 'biological' };
        else if (kind === 'child') rel = { type: 'parent', source: anchorId, target: p.id, subtype: 'biological' };
        else if (kind === 'partner') rel = { type: 'partner', source: anchorId, target: p.id };
        else rel = anchorParents[0] ? { type: 'parent', source: anchorParents[0], target: p.id, subtype: 'biological' } : null;
        let problem = rel ? validateRelationship(tree, rel) : null;
        if (problem && kind === 'parent' && problem.includes('two biological parents')) problem = null; // can still link as adoptive/step
        if (kind === 'sibling' && !anchorParents.length) problem = null;
        return { p, problem };
      })
      .slice(0, 40);
  }, [tree, kind, anchorId, existingQuery, anchorParents]);

  const onPhoto = async (file) => {
    if (!file) return;
    try {
      setPhoto(await readImageFile(file, { maxSize: privacy.imageMaxSize, quality: privacy.imageQuality }));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const submit = (values) => {
    setError('');
    const opts = {
      kind,
      anchorId,
      subtype: kind === 'parent' && bioParentCount >= 2 && values.subtype === 'biological' ? 'step' : values.subtype,
      status: values.status,
      startDate: values.startDate,
      otherParentId: values.otherParentId || null,
      linkCoParent: values.linkCoParent,
      siblingParentIds: kind === 'sibling' && values.siblingType === 'half' && values.halfParentId ? [values.halfParentId] : undefined,
    };
    if (mode === 'existing') {
      if (!existingId) return setError('Choose a person to link.');
      opts.existingId = existingId;
    } else {
      opts.person = {
        firstName: values.firstName.trim(),
        middleName: values.middleName.trim(),
        lastName: values.lastName.trim(),
        birthSurname: values.birthSurname.trim() || values.lastName.trim(),
        gender: values.gender,
        birthDate: values.birthDate,
        deathDate: values.deathDate,
        isLiving: values.deathDate ? false : values.isLiving,
        birthPlace: values.birthPlace,
        location: values.location,
        photo: photo ? { src: photo, x: 50, y: 50, zoom: 1 } : null,
      };
    }
    const res = addRelative(opts);
    if (!res.ok) return setError(res.error);
    const name = displayName(useTreeStore.getState().trees[tree.id].people[res.id]);
    toast(mode === 'existing' ? `Linked ${name}.` : `Added ${name}.`, 'success');
    closeModal();
    setTimeout(() => requestViewport('center', res.id), 120);
  };

  const footer = (
    <>
      <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
      <button type="submit" form="add-person-form" className="btn btn-primary">
        {mode === 'existing' ? <><Link2 size={15} /> Link person</> : <><UserPlus size={15} /> Save person</>}
      </button>
    </>
  );

  return (
    <Modal
      title={meta.title}
      subtitle={anchor ? `Adding a ${meta.verb} for ${displayName(anchor)}` : 'Create a new person in this tree'}
      icon={meta.icon}
      onClose={closeModal}
      footer={footer}
      width="max-w-xl"
    >
      <form id="add-person-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {kind !== 'none' && (
          <div className="inline-flex rounded-[var(--radius)] border border-line bg-surface-alt/60 p-0.5" role="radiogroup" aria-label="Create or link">
            {[{ id: 'new', label: 'Create new person' }, { id: 'existing', label: 'Link existing person' }].map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={mode === o.id} onClick={() => { setMode(o.id); setError(''); }}
                className={`px-3 py-1 text-[0.8rem] rounded-[calc(var(--radius)*0.75)] ${mode === o.id ? 'bg-surface shadow-sm font-medium' : 'text-muted'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* Relationship-specific options */}
        {kind === 'parent' && (
          <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-[var(--radius)] bg-surface-alt/50 border border-line">
            <Field label="Parent type">
              <select className="select" {...register('subtype')}>
                {PARENT_TYPES.map((t) => <option key={t.id} value={t.id} disabled={t.id === 'biological' && bioParentCount >= 2}>{t.label}</option>)}
              </select>
            </Field>
            {anchorParents.length === 1 && subtype === 'biological' && (
              <label className="flex items-start gap-2 text-[0.82rem] sm:pt-5">
                <input type="checkbox" className="mt-0.5" {...register('linkCoParent')} />
                <span>Partner of {displayName(tree.people[anchorParents[0]])}</span>
              </label>
            )}
            {bioParentCount >= 2 && <p className="sm:col-span-2 text-[0.75rem] text-muted">{displayName(anchor)} already has two biological parents, so this will be an adoptive, step or foster parent.</p>}
          </div>
        )}
        {kind === 'partner' && (
          <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-[var(--radius)] bg-surface-alt/50 border border-line">
            <Field label="Relationship">
              <select className="select" {...register('status')}>
                {PARTNER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Since (marriage / start date)" error={errors.startDate}>
              <DateInput register={register} name="startDate" rules={dateRules} error={errors.startDate} />
            </Field>
          </div>
        )}
        {kind === 'child' && (
          <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-[var(--radius)] bg-surface-alt/50 border border-line">
            <Field label="Other parent">
              <select className="select" {...register('otherParentId')}>
                <option value="">None / unknown</option>
                {anchorPartners.map((id) => <option key={id} value={id}>{displayName(tree.people[id])}</option>)}
              </select>
            </Field>
            <Field label="Child type">
              <select className="select" {...register('subtype')}>
                {PARENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.id === 'adoptive' ? 'Adopted' : t.label}</option>)}
              </select>
            </Field>
          </div>
        )}
        {kind === 'sibling' && (
          <div className="p-3 rounded-[var(--radius)] bg-surface-alt/50 border border-line space-y-2">
            {anchorParents.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Sibling type">
                  <select className="select" {...register('siblingType')}>
                    <option value="full">Full sibling (same parents)</option>
                    {anchorParents.length > 1 && <option value="half">Half-sibling</option>}
                  </select>
                </Field>
                {siblingType === 'half' && (
                  <Field label="Shared parent">
                    <select className="select" {...register('halfParentId')}>
                      {anchorParents.map((id) => <option key={id} value={id}>{displayName(tree.people[id])}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            ) : (
              <p className="text-[0.78rem] text-muted">Siblings are linked through shared parents. {displayName(anchor)} has no parents yet, so an “Unknown” placeholder parent will be created — you can fill it in later.</p>
            )}
          </div>
        )}

        {mode === 'existing' ? (
          <div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input !pl-8" placeholder="Search people in this tree" value={existingQuery} onChange={(e) => setExistingQuery(e.target.value)} />
            </div>
            <ul className="max-h-64 overflow-y-auto scroll-thin rounded-[var(--radius)] border border-line divide-y divide-line">
              {candidates.map(({ p, problem }) => (
                <li key={p.id}>
                  <label className={`flex items-center gap-2.5 px-3 py-2 ${problem ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-alt'}`} title={problem || ''}>
                    <input type="radio" name="existing" disabled={Boolean(problem)} checked={existingId === p.id} onChange={() => setExistingId(p.id)} />
                    <Avatar person={p} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.85rem] truncate">{fullName(p)}</span>
                      <span className="block text-[0.7rem] text-muted truncate">{problem || lifespan(p)}</span>
                    </span>
                  </label>
                </li>
              ))}
              {!candidates.length && <li className="px-3 py-4 text-sm text-muted text-center">No matching people.</li>}
            </ul>
          </div>
        ) : (
          <>
            <div className="flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <Avatar person={{ firstName, lastName, gender: watch('gender'), photo: photo ? { src: photo } : null }} size={72} />
                  {photo && (
                    <button type="button" className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-surface border border-line flex items-center justify-center" onClick={() => setPhoto(null)} aria-label="Remove photo">
                      <X size={11} />
                    </button>
                  )}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Upload size={13} /> Photo</button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Field label="Given name" error={errors.firstName}>
                  <input className="input" aria-invalid={Boolean(errors.firstName)} {...register('firstName', { required: 'A given name is required' })} />
                </Field>
                <Field label="Middle name(s)"><input className="input" {...register('middleName')} /></Field>
                <Field label="Surname"><input className="input" {...register('lastName')} /></Field>
                <Field label="Surname at birth"><input className="input" placeholder="If different" {...register('birthSurname')} /></Field>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Gender">
                <select className="select" {...register('gender')}>
                  {GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </Field>
              <Field label="Date of birth" error={errors.birthDate}>
                <DateInput register={register} name="birthDate" rules={dateRules} error={errors.birthDate} />
              </Field>
              <Field label="Date of death" error={errors.deathDate}>
                <DateInput register={register} name="deathDate" rules={deathRules(getValues)} error={errors.deathDate} placeholder="If deceased" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[0.82rem]"><input type="checkbox" {...register('isLiving')} /> Living</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Place of birth"><input className="input" placeholder="Town, Country" {...register('birthPlace')} /></Field>
              <Field label="Current location"><input className="input" placeholder="Town, Country" {...register('location')} /></Field>
            </div>

            {duplicates.length > 0 && (
              <div className="rounded-[var(--radius)] border border-accent-2/50 bg-accent-2/10 p-3 text-[0.8rem]" role="status">
                <div className="flex items-center gap-1.5 font-medium mb-1.5"><AlertTriangle size={14} className="text-accent-2" /> This person may already be in the tree</div>
                {duplicates.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 py-1">
                    <Avatar person={d} size={24} />
                    <span className="flex-1 truncate">{fullName(d)} <span className="text-muted">· {lifespan(d)}</span></span>
                    {kind !== 'none' && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setMode('existing'); setExistingId(d.id); setExistingQuery(d.firstName); }}>
                        Link instead
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && <div className="rounded-[var(--radius)] border border-[#b4483d]/40 bg-[#b4483d]/8 px-3 py-2 text-[0.82rem] text-[#b4483d]" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
