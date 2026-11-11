import { useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useSelectedPerson } from '../../store/familyTreeStore';
import PersonDetails from '../person/PersonDetails';
import Avatar from '../ui/Avatar';

export default function Sidebar() {
  const open = useUiStore((s) => s.sidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  const person = useSelectedPerson();

  // On narrow screens the panel overlays the canvas, so close it with Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && window.innerWidth < 768 && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  if (!open) {
    return (
      <aside className="hidden md:flex w-12 shrink-0 flex-col items-center gap-3 py-3 bg-sidebar border-r border-line" aria-label="Person panel (collapsed)">
        <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Expand person panel" title="Expand panel ([)">
          <PanelLeftOpen size={18} />
        </button>
        {person && (
          <button type="button" onClick={() => setOpen(true)} title={`Show ${person.firstName}`} className="rounded-full">
            <Avatar person={person} size={30} />
          </button>
        )}
      </aside>
    );
  }

  return (
    <>
      <div className="md:hidden fixed inset-0 top-13 bg-black/25 z-30 anim-fade" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        className="fixed md:static top-13 bottom-0 left-0 z-30 w-[min(21rem,92vw)] md:w-[20rem] lg:w-[21.5rem] shrink-0 flex flex-col bg-sidebar border-r border-line shadow-xl md:shadow-none anim-fade"
        aria-label="Person information"
      >
        <div className="flex items-center justify-between h-10 px-3 border-b border-line">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">Person</span>
          <button type="button" className="icon-btn h-8 w-8" onClick={() => setOpen(false)} aria-label="Collapse person panel" title="Collapse panel ([)">
            <PanelLeftClose size={17} />
          </button>
        </div>
        <PersonDetails />
      </aside>
    </>
  );
}
