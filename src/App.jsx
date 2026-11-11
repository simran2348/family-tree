import { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useTreeStore } from './store/familyTreeStore';
import { useSettingsStore } from './store/settingsStore';
import { useUiStore } from './store/uiStore';
import { useApplyTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainCanvas from './components/layout/MainCanvas';
import TimelineView from './components/views/TimelineView';
import StatisticsView from './components/views/StatisticsView';
import ModalRoot from './components/modals/ModalRoot';
import SettingsPanel from './components/settings/SettingsPanel';
import ContextMenu from './components/family-tree/ContextMenu';
import Toasts from './components/ui/Toasts';
import ErrorBoundary from './components/ui/ErrorBoundary';

function TreeView() {
  return (
    <div className="flex-1 flex min-h-0 relative">
      <Sidebar />
      <MainCanvas />
    </div>
  );
}

function LandingRedirect() {
  const navigate = useNavigate();
  const done = useRef(false);
  const landing = useSettingsStore((s) => s.general.landing);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = window.location.hash.replace('#', '');
    if ((!hash || hash === '/') && landing !== 'tree') navigate(`/${landing}`, { replace: true });
  }, [landing, navigate]);
  return null;
}

function Shell() {
  useKeyboardShortcuts();
  const fullscreen = useUiStore((s) => s.fullscreen);
  return (
    <div className="h-full flex flex-col bg-app text-fg font-body">
      <LandingRedirect />
      {!fullscreen && <Header />}
      <Routes>
        <Route path="/" element={<TreeView />} />
        <Route path="/timeline" element={<TimelineView />} />
        <Route path="/statistics" element={<StatisticsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ContextMenu />
      <SettingsPanel />
      <ModalRoot />
      <Toasts />
    </div>
  );
}

export default function App() {
  useApplyTheme();
  const hydrated = useTreeStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-app">
        <div className="text-muted text-sm font-heading text-lg animate-pulse">Opening your family tree…</div>
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <HashRouter>
        <ReactFlowProvider>
          <Shell />
        </ReactFlowProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
