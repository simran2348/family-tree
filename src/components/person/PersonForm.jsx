import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { toast } from '../../store/uiStore';
import { PersonalFields } from './PersonalTab';
import { BiographyFields } from './BiographyTab';

const EDITABLE = [
  'firstName', 'middleName', 'lastName', 'birthSurname', 'gender', 'birthDate', 'deathDate', 'isLiving', 'birthPlace',
  'location', 'nationality', 'relationshipStatus', 'customFields', 'shortBio', 'lifeStory', 'education', 'occupation', 'events', 'notes',
];

const pick = (p) => Object.fromEntries(EDITABLE.map((k) => [k, p[k] ?? (Array.isArray(p[k]) ? [] : '')]));

/** Edit form for the sidebar. Values persist across Personal/Biography tabs until saved. */
export default function PersonForm({ person, tab, onDone }) {
  const updatePerson = useTreeStore((s) => s.updatePerson);
  const form = useForm({ defaultValues: pick(person), mode: 'onBlur' });
  const { register, control, handleSubmit, formState: { errors, isDirty }, getValues, watch, reset } = form;

  useEffect(() => reset(pick(person)), [person.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (values) => {
    const clean = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      isLiving: values.deathDate ? false : values.isLiving,
      customFields: (values.customFields || []).filter((f) => f.label || f.value),
      events: (values.events || []).filter((e) => e.title || e.date),
    };
    updatePerson(person.id, clean, 'Edit person');
    toast('Changes saved.', 'success');
    onDone();
  };

  const onInvalid = () => toast('Please fix the highlighted fields.', 'error');

  return (
    <form id="person-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="pb-2" noValidate>
      {tab === 'personal' && <PersonalFields register={register} control={control} errors={errors} getValues={getValues} watch={watch} />}
      {tab === 'biography' && <BiographyFields register={register} control={control} errors={errors} />}
      <div className="sticky bottom-0 -mx-4 mt-4 px-4 py-2.5 bg-sidebar/95 backdrop-blur border-t border-line flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!isDirty}><Save size={14} /> Save changes</button>
      </div>
    </form>
  );
}
