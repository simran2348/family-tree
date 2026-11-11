// Built-in colour themes. Every theme defines the full token set so that
// any of them can be used as the base for a custom theme.
export const THEME_TOKENS = [
  { key: 'appBg', label: 'Application background' },
  { key: 'headerBg', label: 'Header background' },
  { key: 'headerText', label: 'Header text' },
  { key: 'sidebarBg', label: 'Sidebar background' },
  { key: 'surface', label: 'Panels & dialogs' },
  { key: 'surfaceAlt', label: 'Subtle fill' },
  { key: 'canvasBg', label: 'Canvas background' },
  { key: 'gridColor', label: 'Grid colour' },
  { key: 'cardBg', label: 'Card background' },
  { key: 'cardBorder', label: 'Card border' },
  { key: 'accent', label: 'Primary accent' },
  { key: 'accent2', label: 'Secondary accent' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'border', label: 'UI borders' },
  { key: 'buttonBg', label: 'Button background' },
  { key: 'buttonText', label: 'Button text' },
  { key: 'connector', label: 'Connector colour' },
  { key: 'selected', label: 'Selected highlight' },
];

export const BUILT_IN_THEMES = [
  {
    id: 'classic-sage',
    name: 'Classic Sage',
    dark: false,
    colors: {
      appBg: '#f4f2ec', headerBg: '#8a9f86', headerText: '#fbfaf5', sidebarBg: '#ffffff',
      surface: '#ffffff', surfaceAlt: '#f3f1ea', canvasBg: '#f8f7f2', gridColor: '#c4c8bb',
      gridOpacity: 0.32, cardBg: '#fdfcf8', cardBorder: '#d8d5c8', accent: '#4f6b52',
      accent2: '#b49a6a', text: '#2c3029', muted: '#767a6e', border: '#e4e1d7',
      buttonBg: '#4f6b52', buttonText: '#ffffff', connector: '#9aa594', selected: '#3f5f44',
    },
  },
  {
    id: 'heritage',
    name: 'Heritage',
    dark: false,
    colors: {
      appBg: '#f3ece0', headerBg: '#a08463', headerText: '#fffaf0', sidebarBg: '#fffdf8',
      surface: '#fffdf8', surfaceAlt: '#f5ede0', canvasBg: '#f8f2e7', gridColor: '#d4c4a8',
      gridOpacity: 0.32, cardBg: '#fffaf0', cardBorder: '#dccbaf', accent: '#7a5a3a',
      accent2: '#a8823f', text: '#3a2e22', muted: '#8a7a66', border: '#e6d9c4',
      buttonBg: '#7a5a3a', buttonText: '#ffffff', connector: '#b39d7f', selected: '#6b4a2b',
    },
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    dark: false,
    colors: {
      appBg: '#fafafa', headerBg: '#ffffff', headerText: '#1f2328', sidebarBg: '#ffffff',
      surface: '#ffffff', surfaceAlt: '#f4f4f5', canvasBg: '#ffffff', gridColor: '#d4d4d8',
      gridOpacity: 0.35, cardBg: '#ffffff', cardBorder: '#e4e4e7', accent: '#3f3f46',
      accent2: '#a1a1aa', text: '#18181b', muted: '#71717a', border: '#e4e4e7',
      buttonBg: '#27272a', buttonText: '#ffffff', connector: '#a1a1aa', selected: '#18181b',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    dark: true,
    colors: {
      appBg: '#16181a', headerBg: '#1f2523', headerText: '#dfe7de', sidebarBg: '#1c1f1e',
      surface: '#212523', surfaceAlt: '#2a2f2c', canvasBg: '#181b1a', gridColor: '#3a423d',
      gridOpacity: 0.42, cardBg: '#232826', cardBorder: '#363e39', accent: '#8fb48f',
      accent2: '#c2a878', text: '#e4e8e2', muted: '#8c968e', border: '#2f3532',
      buttonBg: '#7da27d', buttonText: '#0f130f', connector: '#5d6b61', selected: '#a7cfa7',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    dark: false,
    colors: {
      appBg: '#eff3f6', headerBg: '#6d8aa3', headerText: '#f7fafc', sidebarBg: '#ffffff',
      surface: '#ffffff', surfaceAlt: '#edf2f6', canvasBg: '#f5f8fa', gridColor: '#c3cfd9',
      gridOpacity: 0.35, cardBg: '#fbfdfe', cardBorder: '#cfdbe4', accent: '#3d6481',
      accent2: '#7f9bb0', text: '#1f2d3a', muted: '#6b7d8c', border: '#dde5ec',
      buttonBg: '#3d6481', buttonText: '#ffffff', connector: '#97abbc', selected: '#2c5372',
    },
  },
  {
    id: 'rosewood',
    name: 'Rosewood',
    dark: false,
    colors: {
      appBg: '#f6eff0', headerBg: '#b08a8d', headerText: '#fffafa', sidebarBg: '#fffdfd',
      surface: '#fffdfd', surfaceAlt: '#f6eced', canvasBg: '#faf5f4', gridColor: '#dfc9ca',
      gridOpacity: 0.32, cardBg: '#fffafa', cardBorder: '#e6d2d3', accent: '#8b5459',
      accent2: '#b9917a', text: '#3b2a2c', muted: '#8e7a7c', border: '#ecdfe0',
      buttonBg: '#8b5459', buttonText: '#ffffff', connector: '#c0a2a4', selected: '#74424a',
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    dark: false,
    colors: {
      appBg: '#ece3cf', headerBg: '#8b7355', headerText: '#f8f0dc', sidebarBg: '#f7f0de',
      surface: '#f7f0de', surfaceAlt: '#eee3c9', canvasBg: '#f2e9d3', gridColor: '#cdb98e',
      gridOpacity: 0.28, cardBg: '#faf3e1', cardBorder: '#d2bf95', accent: '#6e5432',
      accent2: '#9c7a45', text: '#3b2f1e', muted: '#85745a', border: '#ded0ad',
      buttonBg: '#6e5432', buttonText: '#fbf5e6', connector: '#a89270', selected: '#5a4126',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    dark: true,
    colors: {
      appBg: '#1b241d', headerBg: '#24392a', headerText: '#e6eadb', sidebarBg: '#1f2a22',
      surface: '#233026', surfaceAlt: '#2b3a2f', canvasBg: '#1d271f', gridColor: '#3c4f40',
      gridOpacity: 0.39, cardBg: '#26342a', cardBorder: '#3b4e3f', accent: '#a3b77d',
      accent2: '#c49a5b', text: '#e8eadf', muted: '#9aa58f', border: '#334437',
      buttonBg: '#8ea766', buttonText: '#142015', connector: '#6c8061', selected: '#c7d99d',
    },
  },
];

export const getBuiltInTheme = (id) =>
  BUILT_IN_THEMES.find((t) => t.id === id) || BUILT_IN_THEMES[0];

export const HEADING_FONTS = [
  { id: 'cormorant', label: 'Cormorant Garamond', css: '"Cormorant Garamond", Georgia, serif' },
  { id: 'playfair', label: 'Playfair Display', css: '"Playfair Display", Georgia, serif' },
  { id: 'baskerville', label: 'Libre Baskerville', css: '"Libre Baskerville", Georgia, serif' },
  { id: 'garamond', label: 'EB Garamond', css: '"EB Garamond", Georgia, serif' },
  { id: 'inter', label: 'Inter (sans-serif)', css: 'Inter, system-ui, sans-serif' },
];

export const BODY_FONTS = [
  { id: 'inter', label: 'Inter', css: 'Inter, system-ui, sans-serif' },
  { id: 'source', label: 'Source Sans 3', css: '"Source Sans 3", system-ui, sans-serif' },
  { id: 'lato', label: 'Lato', css: 'Lato, system-ui, sans-serif' },
  { id: 'system', label: 'System default', css: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  { id: 'baskerville', label: 'Libre Baskerville (serif)', css: '"Libre Baskerville", Georgia, serif' },
];
