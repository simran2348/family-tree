import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { getBuiltInTheme, HEADING_FONTS, BODY_FONTS } from '../constants/themes';

const luminance = (hex) => {
  const m = (hex || '').replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!m) return 1;
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function useSystemDark() {
  const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const [dark, setDark] = useState(query?.matches ?? false);
  useEffect(() => {
    if (!query) return undefined;
    const fn = (e) => setDark(e.matches);
    query.addEventListener('change', fn);
    return () => query.removeEventListener('change', fn);
  }, [query]);
  return dark;
}

export function resolveTheme(appearance, systemDark) {
  if (appearance.mode === 'custom') {
    const colors = { ...getBuiltInTheme(appearance.lightTheme).colors, ...(appearance.customColors || {}) };
    return { colors, dark: luminance(colors.appBg) < 0.35, name: 'Custom' };
  }
  const dark = appearance.mode === 'dark' || (appearance.mode === 'system' && systemDark);
  const theme = getBuiltInTheme(dark ? appearance.darkTheme : appearance.lightTheme);
  return { colors: theme.colors, dark: theme.dark, name: theme.name };
}

export function useResolvedTheme() {
  const appearance = useSettingsStore((s) => s.appearance);
  const systemDark = useSystemDark();
  return resolveTheme(appearance, systemDark);
}

const toVar = (key) => `--c-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** Writes theme, typography, density and accessibility preferences to CSS variables on <html>. */
export function useApplyTheme() {
  const appearance = useSettingsStore((s) => s.appearance);
  const a11y = useSettingsStore((s) => s.accessibility);
  const systemDark = useSystemDark();
  const { colors, dark } = resolveTheme(appearance, systemDark);

  useEffect(() => {
    const root = document.documentElement;
    const c = { ...colors };
    if (a11y.highContrast) {
      c.text = dark ? '#ffffff' : '#000000';
      c.muted = dark ? '#d4d4d4' : '#2b2b2b';
      c.border = dark ? '#9a9a9a' : '#4a4a4a';
      c.cardBorder = dark ? '#d0d0d0' : '#222222';
      c.connector = dark ? '#e0e0e0' : '#222222';
    }
    for (const [k, v] of Object.entries(c)) if (typeof v === 'string') root.style.setProperty(toVar(k), v);
    root.style.setProperty('--grid-opacity', String(c.gridOpacity ?? 0.45));
    root.style.setProperty('--f-heading', (HEADING_FONTS.find((f) => f.id === appearance.headingFont) || HEADING_FONTS[0]).css);
    root.style.setProperty('--f-body', (BODY_FONTS.find((f) => f.id === appearance.bodyFont) || BODY_FONTS[0]).css);
    root.style.fontSize = `${(appearance.fontSize * a11y.fontScale) / 100}px`;
    root.style.setProperty('--radius', `${appearance.radius}px`);
    root.style.setProperty('--d', appearance.density === 'compact' ? '0.78' : appearance.density === 'spacious' ? '1.25' : '1');
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.motion = a11y.reducedMotion || !appearance.animations ? 'reduce' : 'full';
    root.dataset.contrast = a11y.highContrast ? 'high' : 'normal';
    root.style.colorScheme = dark ? 'dark' : 'light';
  }, [colors, dark, appearance, a11y]);
}

export function useMotion() {
  const reduced = useSettingsStore((s) => s.accessibility.reducedMotion || !s.appearance.animations);
  return reduced ? 0 : 450;
}
