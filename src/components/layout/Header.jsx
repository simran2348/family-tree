import { NavLink } from 'react-router-dom';
import { Undo2, Redo2, Settings, UserRound, Network, CalendarClock, BarChart3, Keyboard, PanelLeft } from 'lucide-react';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import SearchBox from './SearchBox';
import TreeSwitcher from './TreeSwitcher';

// The application name is intentionally left empty for now.
export const APP_NAME = '';

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.16" />
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 26V15M16 15l-6-5M16 15l6-5M16 19.5l-3.5-2.5M16 19.5l3.5-2.5" />
      </g>
      <g fill="currentColor">
        <circle cx="10" cy="9" r="2.3" /><circle cx="22" cy="9" r="2.3" /><circle cx="16" cy="6" r="2.3" />
      </g>
    </svg>
  );
}

const navItems = [
  { to: '/', label: 'Tree', icon: Network, end: true },
  { to: '/timeline', label: 'Timeline', icon: CalendarClock },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
];

export default function Header() {
  const undo = useTreeStore((s) => s.undo);
  const redo = useTreeStore((s) => s.redo);
  const canUndo = useTreeStore((s) => s.past.length > 0 && s.past[s.past.length - 1].treeId === s.activeTreeId);
  const canRedo = useTreeStore((s) => s.future.length > 0);
  const openSettings = useUiStore((s) => s.openSettings);
  const openModal = useUiStore((s) => s.openModal);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const profile = useSettingsStore((s) => s.profile);

  return (
    <header className="h-13 shrink-0 flex items-center gap-2 px-2 sm:px-3 bg-header text-header-fg border-b border-black/10 relative z-30">
      <button type="button" className="icon-btn !text-header-fg hover:!bg-header-fg/12 md:hidden" onClick={toggleSidebar} aria-label="Toggle person panel">
        <PanelLeft size={18} />
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <span className="hidden sm:block"><Logo /></span>
        {APP_NAME && <span className="font-heading text-lg font-semibold whitespace-nowrap">{APP_NAME}</span>}
        <span className="h-5 w-px bg-header-fg/25 hidden sm:block" aria-hidden="true" />
        <TreeSwitcher />
      </div>

      <nav className="hidden lg:flex items-center gap-0.5 ml-2" aria-label="Views">
        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius)] text-[0.82rem] transition-colors ${isActive ? 'bg-header-fg/18 font-medium' : 'opacity-80 hover:opacity-100 hover:bg-header-fg/10'}`}
          >
            <n.icon size={15} /> {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 flex justify-center px-2 min-w-0">
        <div className="hidden sm:block w-full max-w-xs"><SearchBox /></div>
      </div>

      <div className="flex items-center gap-0.5">
        <nav className="flex lg:hidden items-center" aria-label="Views">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} aria-label={n.label} title={n.label}
              className={({ isActive }) => `icon-btn !text-header-fg ${isActive ? '!bg-header-fg/18' : 'hover:!bg-header-fg/12'}`}>
              <n.icon size={17} />
            </NavLink>
          ))}
        </nav>
        <button type="button" className="icon-btn !text-header-fg hover:!bg-header-fg/12 hidden sm:inline-flex" disabled={!canUndo}
          onClick={() => { const l = undo(); if (l) toast(`Undid: ${l}`); }} aria-label="Undo" title="Undo (⌘Z)">
          <Undo2 size={17} />
        </button>
        <button type="button" className="icon-btn !text-header-fg hover:!bg-header-fg/12 hidden sm:inline-flex" disabled={!canRedo}
          onClick={() => { const l = redo(); if (l) toast(`Redid: ${l}`); }} aria-label="Redo" title="Redo (⌘⇧Z)">
          <Redo2 size={17} />
        </button>
        <button type="button" className="icon-btn !text-header-fg hover:!bg-header-fg/12 hidden md:inline-flex" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
          <Keyboard size={17} />
        </button>
        <button type="button" className="icon-btn !text-header-fg hover:!bg-header-fg/12" onClick={() => openSettings('general')} aria-label="Settings" title="Settings (⌘,)">
          <Settings size={17} />
        </button>
        <button
          type="button"
          onClick={() => openModal('profile-account')}
          className="ml-1 flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-full border border-header-fg/25 hover:bg-header-fg/12 text-[0.8rem]"
        >
          <span className="h-6 w-6 rounded-full bg-header-fg/20 flex items-center justify-center text-[0.7rem] font-semibold">
            {profile.signedIn && profile.name ? profile.name.charAt(0).toUpperCase() : <UserRound size={14} />}
          </span>
          <span className="hidden sm:inline max-w-28 truncate">{profile.signedIn ? profile.name || 'Profile' : 'Sign in'}</span>
        </button>
      </div>
    </header>
  );
}
