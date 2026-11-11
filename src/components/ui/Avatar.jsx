import { initials } from '../../utils/person';

const tint = {
  male: 'color-mix(in srgb, #5f7f9a 22%, var(--c-card-bg))',
  female: 'color-mix(in srgb, #b07a84 22%, var(--c-card-bg))',
  other: 'color-mix(in srgb, #9a8a5f 22%, var(--c-card-bg))',
  unknown: 'var(--c-surface-alt)',
};

export default function Avatar({ person, size = 48, shape = 'circle', className = '', ring = false }) {
  const radius = shape === 'circle' ? '9999px' : shape === 'rounded' ? `${Math.round(size * 0.22)}px` : '3px';
  const photo = person?.photo;
  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center select-none ${className}`}
      style={{
        width: size, height: size, borderRadius: radius,
        background: tint[person?.gender] || tint.unknown,
        boxShadow: ring ? '0 0 0 2px var(--c-card-bg), 0 0 0 3px var(--c-card-border)' : undefined,
      }}
      aria-hidden="true"
    >
      {photo?.src ? (
        <img
          src={photo.src}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{ objectPosition: `${photo.x ?? 50}% ${photo.y ?? 50}%`, transform: `scale(${photo.zoom ?? 1})`, transformOrigin: `${photo.x ?? 50}% ${photo.y ?? 50}%` }}
        />
      ) : (
        <span className="font-heading font-semibold text-fg/70" style={{ fontSize: Math.max(11, size * 0.36) }}>
          {initials(person)}
        </span>
      )}
    </div>
  );
}
