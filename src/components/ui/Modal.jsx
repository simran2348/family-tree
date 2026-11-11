import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, subtitle, icon: Icon, onClose, children, footer, width = 'max-w-lg', bodyClassName = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    const focusable = el?.querySelector('input:not([type=hidden]), select, textarea, button:not([data-close])');
    focusable?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); }
      if (e.key === 'Tab' && el) {
        const items = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); prev?.focus?.(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 anim-fade" role="presentation">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onMouseDown={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} max-h-[92vh] flex flex-col bg-surface text-fg border border-line shadow-2xl anim-pop rounded-t-[calc(var(--radius)*1.4)] sm:rounded-[calc(var(--radius)*1.4)]`}
      >
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-line">
          {Icon && (
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
              <Icon size={17} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl font-semibold leading-tight">{title}</h2>
            {subtitle && <p className="text-[0.8rem] text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" data-close className="icon-btn -mr-1.5" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className={`overflow-y-auto scroll-thin px-5 py-4 ${bodyClassName}`}>{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3 border-t border-line bg-surface-alt/40">{footer}</div>}
      </div>
    </div>
  );
}
