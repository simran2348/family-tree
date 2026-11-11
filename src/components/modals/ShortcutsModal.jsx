import { Keyboard } from 'lucide-react';
import Modal from '../ui/Modal';
import { useUiStore } from '../../store/uiStore';
import { SHORTCUTS } from '../../constants/shortcuts';

export function ShortcutList() {
  return (
    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
      {SHORTCUTS.map((g) => (
        <section key={g.group}>
          <h3 className="label">{g.group}</h3>
          <ul>
            {g.items.map((s) => (
              <li key={s.label + s.keys.join()} className="flex items-center justify-between py-1 text-[0.84rem] border-b border-line/60 last:border-0">
                <span>{s.label}</span>
                <span className="flex gap-1">{s.keys.map((k) => <kbd key={k} className="kbd">{k}</kbd>)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function ShortcutsModal() {
  const setOpen = useUiStore((s) => s.setShortcutsOpen);
  return (
    <Modal title="Keyboard shortcuts" subtitle="On Windows and Linux use Ctrl instead of ⌘." icon={Keyboard} onClose={() => setOpen(false)} width="max-w-3xl">
      <ShortcutList />
    </Modal>
  );
}
