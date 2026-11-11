import { useFieldArray } from 'react-hook-form';
import { Plus, X, GraduationCap, Briefcase, CalendarDays } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDate, dateSortKey } from '../../utils/dates';
import { uid } from '../../utils/id';
import { Field, DateInput, dateRules } from './fields';

function Block({ title, children }) {
  if (!children) return null;
  return (
    <section className="mb-4">
      <h4 className="label">{title}</h4>
      <div className="text-[0.86rem] leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  );
}

export function BiographyView({ person }) {
  const { dateFormat, locale } = useSettingsStore((s) => s.general);
  const events = [...(person.events || [])].sort((a, b) => dateSortKey(a.date) - dateSortKey(b.date));
  const empty = !person.shortBio && !person.lifeStory && !person.education && !person.occupation && !events.length && !person.notes;
  return (
    <div>
      {person.shortBio && <p className="font-heading text-[1.08rem] italic leading-snug mb-4 text-fg/90">“{person.shortBio}”</p>}
      {(person.occupation || person.education) && (
        <div className="grid gap-2 mb-4">
          {person.occupation && <div className="flex items-start gap-2 text-[0.85rem]"><Briefcase size={15} className="text-muted mt-0.5 shrink-0" />{person.occupation}</div>}
          {person.education && <div className="flex items-start gap-2 text-[0.85rem]"><GraduationCap size={15} className="text-muted mt-0.5 shrink-0" />{person.education}</div>}
        </div>
      )}
      <Block title="Life story">{person.lifeStory}</Block>
      {events.length > 0 && (
        <section className="mb-4">
          <h4 className="label">Important life events</h4>
          <ol className="relative border-l border-line ml-1.5 space-y-3 mt-2">
            {events.map((ev) => (
              <li key={ev.id} className="pl-4 relative">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-2 ring-2 ring-sidebar" />
                <div className="text-[0.72rem] text-muted tabular-nums">{ev.date ? formatDate(ev.date, dateFormat, locale) : 'Undated'}</div>
                <div className="text-[0.86rem] font-medium">{ev.title}</div>
                {ev.description && <div className="text-[0.8rem] text-muted">{ev.description}</div>}
              </li>
            ))}
          </ol>
        </section>
      )}
      <Block title="Additional notes">{person.notes}</Block>
      {empty && <p className="text-[0.8rem] text-muted italic py-2">No biography yet. Use Edit Person to record their story.</p>}
    </div>
  );
}

export function BiographyFields({ register, control, errors }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'events' });
  return (
    <div className="space-y-3">
      <Field label="Short biography" hint="Shown on cards when descriptions are enabled.">
        <input className="input" maxLength={140} {...register('shortBio')} />
      </Field>
      <Field label="Life story"><textarea className="textarea" rows={5} {...register('lifeStory')} /></Field>
      <Field label="Education"><input className="input" {...register('education')} /></Field>
      <Field label="Occupation"><input className="input" {...register('occupation')} /></Field>
      <div>
        <div className="flex items-center justify-between">
          <span className="label !mb-0 flex items-center gap-1"><CalendarDays size={12} /> Important life events</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => append({ id: uid('ev'), date: '', title: '', description: '' })}>
            <Plus size={13} /> Add event
          </button>
        </div>
        {fields.map((f, i) => (
          <div key={f.id} className="mt-2 p-2 rounded-[var(--radius)] border border-line bg-surface-alt/40 space-y-1.5">
            <div className="flex gap-1.5">
              <div className="w-28 shrink-0"><DateInput register={register} name={`events.${i}.date`} rules={dateRules} error={errors.events?.[i]?.date} placeholder="Date" /></div>
              <input className="input flex-1" placeholder="Event title" {...register(`events.${i}.title`)} />
              <button type="button" className="icon-btn" onClick={() => remove(i)} aria-label="Remove event"><X size={14} /></button>
            </div>
            <input className="input" placeholder="Description (optional)" {...register(`events.${i}.description`)} />
            {errors.events?.[i]?.date && <p className="field-error">{errors.events[i].date.message}</p>}
          </div>
        ))}
      </div>
      <Field label="Additional notes"><textarea className="textarea" rows={4} {...register('notes')} /></Field>
    </div>
  );
}
