// Small form controls shared by the settings panels and forms.
import { useId } from 'react';

export function Row({ label, hint, children, stacked = false }) {
  return (
    <div className={`py-2.5 ${stacked ? '' : 'flex items-center justify-between gap-4'}`}>
      <div className={stacked ? 'mb-1.5' : 'min-w-0'}>
        <div className="text-[0.85rem] font-medium text-fg">{label}</div>
        {hint && <div className="text-[0.75rem] text-muted leading-snug">{hint}</div>}
      </div>
      <div className={stacked ? '' : 'shrink-0'}>{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line'} disabled:opacity-40`}
    >
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export function Slider({ value, onChange, min, max, step = 1, unit = '', label, format }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3 w-56 max-w-full">
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))} />
      <span className="w-12 text-right text-[0.78rem] tabular-nums text-muted">{format ? format(value) : `${value}${unit}`}</span>
    </div>
  );
}

export function Select({ value, onChange, options, label, className = 'w-48' }) {
  return (
    <select className={`select ${className}`} value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.id ?? o.value} value={o.id ?? o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[var(--radius)] border border-line bg-surface-alt/60 p-0.5">
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.id}
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 text-[0.78rem] rounded-[calc(var(--radius)*0.75)] transition-colors ${value === o.id ? 'bg-surface text-fg shadow-sm font-medium' : 'text-muted hover:text-fg'}`}
        >
          {o.icon ? <o.icon size={14} className="inline -mt-0.5" /> : null}
          {o.label && <span className={o.icon ? 'ml-1' : ''}>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

export function ColorField({ value, onChange, label, allowReset, fallback }) {
  return (
    <div className="flex items-center gap-2">
      {allowReset && value && (
        <button type="button" className="text-[0.72rem] text-muted hover:text-fg underline-offset-2 hover:underline" onClick={() => onChange('')}>
          Use theme
        </button>
      )}
      <input type="color" aria-label={label} value={value || fallback || '#888888'} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mt-5 first:mt-0 mb-1 pb-1.5 border-b border-line">
      <h3 className="font-heading text-[1.05rem] font-semibold">{children}</h3>
      {action}
    </div>
  );
}
