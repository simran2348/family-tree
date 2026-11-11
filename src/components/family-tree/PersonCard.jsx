import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mars, Venus, CircleHelp, MapPin, Plus, Minus, Home } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import { displayName, isDeceased, lifespan } from '../../utils/person';
import { formatDate } from '../../utils/dates';
import Avatar from '../ui/Avatar';

const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px rgb(0 0 0 / .05), 0 1px 3px rgb(0 0 0 / .04)',
  md: '0 4px 10px -2px rgb(0 0 0 / .09), 0 2px 4px -2px rgb(0 0 0 / .05)',
  lg: '0 12px 24px -6px rgb(0 0 0 / .16), 0 4px 8px -4px rgb(0 0 0 / .08)',
};

const GENDER_TINT = { male: '#5f7f9a', female: '#b07a84', other: '#9a8a5f' };

function GenderIcon({ gender, size = 12 }) {
  if (gender === 'male') return <Mars size={size} aria-label="Male" style={{ color: GENDER_TINT.male }} />;
  if (gender === 'female') return <Venus size={size} aria-label="Female" style={{ color: GENDER_TINT.female }} />;
  if (gender === 'other') return <CircleHelp size={size} aria-label="Other" style={{ color: GENDER_TINT.other }} />;
  return null;
}

function PersonCard({ id, data }) {
  const person = useTreeStore((s) => s.trees[s.activeTreeId]?.people[id]);
  const isSelected = useTreeStore((s) => s.selectedId === id);
  const isMulti = useTreeStore((s) => s.multiSelect.includes(id));
  const isHome = useTreeStore((s) => s.trees[s.activeTreeId]?.homePersonId === id);
  const toggleCollapsed = useTreeStore((s) => s.toggleCollapsed);
  const card = useSettingsStore((s) => s.card);
  const general = useSettingsStore((s) => s.general);
  const privacy = useSettingsStore((s) => s.privacy);
  const exporting = useUiStore((s) => s.exporting);

  if (!person) return null;
  const deceased = isDeceased(person);
  const hideDates = !deceased && (privacy.hideLivingDatesOnCards || (exporting && privacy.maskLivingInExports));
  const vertical = card.layout === 'vertical';

  let background = 'var(--c-card-bg)';
  if (card.background === 'gender' && GENDER_TINT[person.gender])
    background = `color-mix(in srgb, ${GENDER_TINT[person.gender]} 11%, var(--c-card-bg))`;
  if (card.background === 'accent') background = 'color-mix(in srgb, var(--c-accent) 7%, var(--c-card-bg))';
  if (card.background === 'transparent') background = 'transparent';

  const selColor = 'var(--c-selected)';
  let boxShadow = SHADOWS[card.shadow] || SHADOWS.sm;
  let borderColor = person.isPlaceholder ? 'var(--c-muted)' : 'var(--c-card-border)';
  let borderWidth = card.borderWidth;
  if (isSelected) {
    if (card.selectedStyle === 'thick') { borderColor = selColor; borderWidth = Math.max(2.5, card.borderWidth + 1.5); }
    else if (card.selectedStyle === 'glow') { borderColor = selColor; boxShadow = `0 0 0 1px ${selColor}, 0 0 22px -2px color-mix(in srgb, ${selColor} 45%, transparent)`; }
    else { borderColor = selColor; boxShadow = `0 0 0 2px ${selColor}, ${boxShadow === 'none' ? '0 0 0 0 transparent' : boxShadow}`; }
  } else if (isMulti) {
    boxShadow = `0 0 0 2px color-mix(in srgb, var(--c-accent2) 70%, transparent)`;
  }

  const dates = (() => {
    if (!card.showDates || hideDates) return '';
    if (card.dateStyle === 'year') return lifespan(person);
    const b = person.birthDate ? formatDate(person.birthDate, general.dateFormat, general.locale) : '';
    const d = person.deathDate ? formatDate(person.deathDate, general.dateFormat, general.locale) : '';
    if (!b && !d) return lifespan(person);
    if (deceased) return `${b || '?'} – ${d || '?'}`;
    return `b. ${b}`;
  })();

  const secondary = [
    card.showLocation && person.location ? { icon: MapPin, text: person.location } : null,
    card.showDescription && (person.shortBio || person.occupation) ? { text: person.shortBio || person.occupation } : null,
  ].filter(Boolean);

  const horizontalAxis = data.axis === 'horizontal';
  const showToggle = data.childCount > 0;

  return (
    <div
      className="group relative h-full w-full transition-[transform,box-shadow] duration-150 hover:-translate-y-px"
      style={{
        background, borderRadius: card.radius, border: `${borderWidth}px ${person.isPlaceholder ? 'dashed' : 'solid'} ${borderColor}`,
        boxShadow, color: 'var(--c-text)', opacity: person.isPlaceholder ? 0.75 : 1,
      }}
      role="button"
      aria-label={`${displayName(person)}${data.relationLabel ? `, ${data.relationLabel}` : ''}`}
      aria-pressed={isSelected}
    >
      <Handle type="target" position={horizontalAxis ? Position.Left : Position.Top} isConnectable={false} />
      <Handle type="source" position={horizontalAxis ? Position.Right : Position.Bottom} isConnectable={false} />

      <div className={`flex h-full w-full overflow-hidden ${vertical ? 'flex-col items-center justify-center text-center px-3 py-2.5 gap-1.5' : 'items-center gap-3 px-3'}`}>
        {card.showPhoto && (
          <Avatar person={person} size={card.photoSize} shape={card.photoShape} className={deceased ? 'grayscale-[35%]' : ''} />
        )}
        <div className={`min-w-0 ${vertical ? 'w-full' : 'flex-1'}`}>
          {card.showRelationship && data.relationLabel && (
            <div className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-accent leading-tight mb-0.5">
              {data.relationLabel === 'Self' ? (general.relativeTo === 'home' ? 'Home person' : 'Selected') : data.relationLabel}
            </div>
          )}
          <div className={`flex items-center gap-1 ${vertical ? 'justify-center' : ''}`}>
            <div className="truncate font-heading text-[1.02rem] font-semibold leading-tight" title={displayName(person)}>
              {displayName(person)}
            </div>
            {card.showGender && <GenderIcon gender={person.gender} />}
            {isHome && <Home size={11} className="text-muted shrink-0" aria-label="Home person" />}
          </div>
          {dates && <div className="truncate text-[0.72rem] text-muted tabular-nums mt-0.5">{dates}{deceased && ' †'}</div>}
          {secondary.map((s, i) => (
            <div key={i} className={`flex items-center gap-1 text-[0.68rem] text-muted mt-0.5 ${vertical ? 'justify-center' : ''}`}>
              {s.icon && <s.icon size={10} className="shrink-0" />}
              <span className="truncate">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {showToggle && (
        <button
          type="button"
          className={`nodrag absolute z-10 flex items-center justify-center gap-0.5 rounded-full border border-card-border bg-surface text-muted hover:text-fg hover:border-accent shadow-sm transition-opacity ${
            data.collapsed ? 'opacity-100 px-1.5 h-5 text-[0.65rem] font-semibold' : 'opacity-0 group-hover:opacity-100 focus:opacity-100 h-5 w-5'
          } ${horizontalAxis ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2' : 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'}`}
          onClick={(e) => { e.stopPropagation(); toggleCollapsed(id); }}
          aria-label={data.collapsed ? `Expand branch (${data.hiddenCount} hidden)` : 'Collapse branch'}
          title={data.collapsed ? `Show ${data.hiddenCount} hidden descendants` : 'Collapse branch'}
        >
          {data.collapsed ? <><Plus size={10} />{data.hiddenCount}</> : <Minus size={11} />}
        </button>
      )}
    </div>
  );
}

export default memo(PersonCard);
