import { useFieldArray } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { GENDERS, RELATIONSHIP_STATUSES } from '../../constants/defaults';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDate, ageBetween } from '../../utils/dates';
import { fullName, isDeceased } from '../../utils/person';
import { uid } from '../../utils/id';
import { Field, DateInput, dateRules, deathRules } from './fields';
import RelativesList from './RelativesList';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 py-1.5 text-[0.84rem] border-b border-line/60 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

export function PersonalView({ person }) {
  const { dateFormat, locale } = useSettingsStore((s) => s.general);
  const fmt = (d) => formatDate(d, dateFormat, locale);
  const deceased = isDeceased(person);
  const age = ageBetween(person.birthDate, person.deathDate || null);
  const born = [person.birthDate && fmt(person.birthDate), person.birthPlace].filter(Boolean).join(' · ');
  const died = deceased ? [person.deathDate ? fmt(person.deathDate) : 'Date unknown', age !== null ? `aged ${age}` : ''].filter(Boolean).join(' · ') : '';
  const empty = !person.birthDate && !person.birthPlace && !person.location && !person.nationality && !person.lastName;
  return (
    <div>
      <dl>
        <InfoRow label="Full name" value={fullName(person)} />
        <InfoRow label="Current surname" value={person.lastName} />
        <InfoRow label="Surname at birth" value={person.birthSurname && person.birthSurname !== person.lastName ? person.birthSurname : ''} />
        <InfoRow label="Gender" value={GENDERS.find((g) => g.id === person.gender)?.label} />
        <InfoRow label="Born" value={born} />
        <InfoRow label={deceased ? 'Died' : 'Age'} value={deceased ? died : age !== null ? `${age} years` : ''} />
        <InfoRow label="Lives in" value={!deceased ? person.location : ''} />
        <InfoRow label="Last residence" value={deceased ? person.location : ''} />
        <InfoRow label="Nationality" value={person.nationality} />
        <InfoRow label="Relationship" value={RELATIONSHIP_STATUSES.find((s) => s.id === person.relationshipStatus)?.label} />
        {person.customFields?.map((f) => <InfoRow key={f.id} label={f.label || 'Field'} value={f.value} />)}
      </dl>
      {empty && <p className="text-[0.8rem] text-muted italic py-2">No personal details yet — use Edit Person to add them.</p>}
      <RelativesList personId={person.id} />
    </div>
  );
}

export function PersonalFields({ register, control, errors, getValues, watch }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'customFields' });
  const living = watch('isLiving');
  return (
    <div className="space-y-3">
      <Field label="Given name" error={errors.firstName}>
        <input className="input" aria-invalid={Boolean(errors.firstName)} {...register('firstName', { required: 'A given name is required', maxLength: { value: 80, message: 'Too long' } })} />
      </Field>
      <Field label="Middle name(s)">
        <input className="input" {...register('middleName')} />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Current surname"><input className="input" {...register('lastName')} /></Field>
        <Field label="Surname at birth"><input className="input" {...register('birthSurname')} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Gender">
          <select className="select" {...register('gender')}>
            {GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </Field>
        <Field label="Relationship status">
          <select className="select" {...register('relationshipStatus')}>
            <option value="">—</option>
            {RELATIONSHIP_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Date of birth" error={errors.birthDate}>
          <DateInput register={register} name="birthDate" rules={dateRules} error={errors.birthDate} />
        </Field>
        <Field label="Date of death" error={errors.deathDate}>
          <DateInput register={register} name="deathDate" rules={deathRules(getValues)} error={errors.deathDate} placeholder={living ? 'Living' : 'YYYY-MM-DD'} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[0.84rem]">
        <input type="checkbox" {...register('isLiving')} /> This person is living
      </label>
      <Field label="Place of birth"><input className="input" placeholder="Town, Country" {...register('birthPlace')} /></Field>
      <Field label="Current location"><input className="input" placeholder="Town, Country" {...register('location')} /></Field>
      <Field label="Nationality"><input className="input" {...register('nationality')} /></Field>

      <div>
        <div className="flex items-center justify-between">
          <span className="label !mb-0">Custom fields</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => append({ id: uid('cf'), label: '', value: '' })}>
            <Plus size={13} /> Add field
          </button>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="flex gap-1.5 mt-1.5">
            <input className="input !w-2/5" placeholder="Label" {...register(`customFields.${i}.label`)} />
            <input className="input flex-1" placeholder="Value" {...register(`customFields.${i}.value`)} />
            <button type="button" className="icon-btn" onClick={() => remove(i)} aria-label="Remove field"><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
