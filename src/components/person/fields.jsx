// Field helpers for react-hook-form based person forms.
import { isValidDate, dateSortKey } from '../../utils/dates';

export function Field({ label, error, children, className = '', hint }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="block text-[0.7rem] text-muted mt-1">{hint}</span>}
      {error && <span className="field-error" role="alert">{error.message}</span>}
    </label>
  );
}

export const dateRules = {
  validate: (v) => isValidDate(v) || 'Use YYYY, YYYY-MM or YYYY-MM-DD',
};

export const deathRules = (getValues) => ({
  validate: (v) => {
    if (!isValidDate(v)) return 'Use YYYY, YYYY-MM or YYYY-MM-DD';
    const b = getValues('birthDate');
    if (v && b && isValidDate(b) && dateSortKey(v) < dateSortKey(b)) return 'Death date is before birth date';
    return true;
  },
});

export function DateInput({ register, name, rules, error, placeholder = 'YYYY-MM-DD' }) {
  return (
    <input className="input tabular-nums" placeholder={placeholder} inputMode="numeric" aria-invalid={Boolean(error)} {...register(name, rules)} />
  );
}
