import { Pencil, MapPin, Briefcase, GraduationCap, Flag, LocateFixed, CalendarDays } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { usePersonActions } from '../../hooks/usePersonActions';
import { fullName, lifespan, ageLabel } from '../../utils/person';
import { formatDate, dateSortKey } from '../../utils/dates';
import { getRelationshipLabel } from '../../utils/kinship';
import { buildTimeline } from '../../utils/timeline';
import RelativesList from './RelativesList';

/** Full-page profile opened by double-clicking a card. */
export default function PersonProfile({ personId }) {
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const closeModal = useUiStore((s) => s.closeModal);
  const { dateFormat, locale } = useSettingsStore((s) => s.general);
  const actions = usePersonActions();
  const person = tree.people[personId];
  if (!person) return null;
  const fmt = (d) => formatDate(d, dateFormat, locale);
  const home = tree.people[tree.homePersonId];
  const relation = home && home.id !== person.id ? getRelationshipLabel(tree, home.id, person.id) : '';
  const events = buildTimeline(tree).filter((e) => e.personIds.includes(person.id)).sort((a, b) => dateSortKey(a.date) - dateSortKey(b.date));

  const facts = [
    { icon: MapPin, label: 'Born', value: [person.birthDate && fmt(person.birthDate), person.birthPlace].filter(Boolean).join(', ') },
    { icon: MapPin, label: person.deathDate || person.isLiving === false ? 'Last residence' : 'Lives in', value: person.location },
    { icon: Briefcase, label: 'Occupation', value: person.occupation },
    { icon: GraduationCap, label: 'Education', value: person.education },
    { icon: Flag, label: 'Nationality', value: person.nationality },
  ].filter((f) => f.value);

  return (
    <Modal
      title={fullName(person)}
      subtitle={[relation && home ? `${relation} of ${home.firstName}` : '', lifespan(person), ageLabel(person)].filter(Boolean).join(' · ')}
      onClose={closeModal}
      width="max-w-3xl"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => { closeModal(); actions.center(person.id); }}><LocateFixed size={15} /> Show on tree</button>
          <button type="button" className="btn btn-primary" onClick={() => { closeModal(); actions.edit(person.id); }}><Pencil size={15} /> Edit person</button>
        </>
      }
    >
      <div className="grid md:grid-cols-[13rem_1fr] gap-6">
        <div>
          <Avatar person={person} size={208} shape="rounded" className="max-w-full" />
          {facts.length > 0 && (
            <dl className="mt-4 space-y-2.5">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-2 text-[0.82rem]">
                  <f.icon size={14} className="text-muted mt-0.5 shrink-0" />
                  <div><dt className="text-[0.68rem] uppercase tracking-wider text-muted">{f.label}</dt><dd>{f.value}</dd></div>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="min-w-0 space-y-5">
          {person.shortBio && <p className="font-heading text-xl italic leading-snug">“{person.shortBio}”</p>}
          {person.lifeStory && (
            <section><h3 className="label">Life story</h3><p className="text-[0.9rem] leading-relaxed whitespace-pre-line">{person.lifeStory}</p></section>
          )}
          {events.length > 0 && (
            <section>
              <h3 className="label flex items-center gap-1"><CalendarDays size={12} /> Timeline</h3>
              <ol className="relative border-l border-line ml-1.5 space-y-2.5 mt-2">
                {events.map((ev) => (
                  <li key={ev.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
                    <span className="text-[0.72rem] text-muted tabular-nums mr-2">{fmt(ev.date)}</span>
                    <span className="text-[0.86rem]">{ev.title}</span>
                    {ev.description && <div className="text-[0.78rem] text-muted">{ev.description}</div>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {person.gallery?.length > 0 && (
            <section>
              <h3 className="label">Photographs</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {person.gallery.map((g) => (
                  <figure key={g.id}>
                    <img src={g.src} alt={g.caption || 'Family photograph'} className="aspect-square w-full object-cover rounded-[calc(var(--radius)*0.8)] border border-line" />
                    {g.caption && <figcaption className="text-[0.7rem] text-muted mt-0.5 truncate">{g.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}
          {person.notes && <section><h3 className="label">Notes</h3><p className="text-[0.86rem] whitespace-pre-line">{person.notes}</p></section>}
          <section><h3 className="label">Family</h3><RelativesList personId={person.id} /></section>
        </div>
      </div>
    </Modal>
  );
}
