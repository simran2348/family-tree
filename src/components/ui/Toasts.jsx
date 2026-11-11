import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const icons = { success: CheckCircle2, error: AlertTriangle, info: Info, warning: AlertTriangle };

export default function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.tone] || Info;
        return (
          <div key={t.id} className="pointer-events-auto popover anim-pop flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 text-[0.84rem] max-w-[90vw]">
            <Icon size={16} className={t.tone === 'error' ? 'text-[#b4483d]' : t.tone === 'warning' ? 'text-accent-2' : 'text-accent'} />
            <span>{t.message}</span>
            <button type="button" className="icon-btn h-7 w-7" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
