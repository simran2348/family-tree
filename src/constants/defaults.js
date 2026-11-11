export const LAYOUT_PRESETS = [
  { id: 'vertical', label: 'Vertical family tree', hint: 'Generations flow top to bottom' },
  { id: 'horizontal', label: 'Horizontal family tree', hint: 'Generations flow left to right' },
  { id: 'descendants', label: 'Descendants', hint: 'Selected person and everyone after them' },
  { id: 'ancestors', label: 'Ancestors', hint: 'Selected person and their forebears' },
  { id: 'pedigree', label: 'Traditional pedigree', hint: 'Ancestors charted left to right' },
  { id: 'compact', label: 'Compact', hint: 'Tighter spacing and smaller cards' },
  { id: 'balanced', label: 'Balanced', hint: 'Even spacing between sibling branches' },
];

export const DEFAULT_SETTINGS = {
  general: {
    defaultLayout: 'vertical',
    landing: 'tree',
    locale: 'en-GB',
    dateFormat: 'D MMM YYYY',
    weekStart: 1,
    relativeTo: 'home', // relationship labels relative to 'home' person or 'selected'
    confirmDeletes: true,
  },
  layout: {
    hSpacing: 36,
    vSpacing: 80,
    partnerSpacing: 36,
    branchSpacing: 56,
    cardWidth: 240,
    cardHeight: 84,
    alignment: 'center', // center | left
    dragToManual: true, // dragging a card in automatic mode switches the tree to manual layout
  },
  card: {
    layout: 'horizontal', // horizontal | vertical
    showPhoto: true,
    showDates: true,
    dateStyle: 'full', // full | year
    showGender: true,
    showLocation: false,
    showDescription: false,
    showRelationship: true,
    photoSize: 48,
    photoShape: 'circle', // circle | rounded | square
    radius: 10,
    shadow: 'sm', // none | sm | md | lg
    background: 'theme', // theme | gender | accent | transparent
    borderWidth: 1,
    selectedStyle: 'ring', // ring | thick | glow
  },
  connector: {
    style: 'orthogonal', // orthogonal | curved | straight
    dashed: false,
    thickness: 1.5,
    color: '', // empty = theme connector colour
    partnerColor: '',
    showLabels: false,
    marriageIndicator: true,
    cornerRadius: 8,
  },
  canvas: {
    showGrid: true,
    gridSize: 24,
    gridOpacity: null, // null = theme default
    gridColor: '', // empty = theme default
    background: '', // empty = theme default
    padding: 0.18,
    snapToGrid: false,
    showMinimap: true,
    showControls: false,
    defaultZoom: 1,
  },
  appearance: {
    mode: 'light', // light | dark | system | custom
    lightTheme: 'classic-sage',
    darkTheme: 'midnight',
    customColors: null,
    customThemes: [],
    activeCustomId: null,
    headingFont: 'cormorant',
    bodyFont: 'inter',
    fontSize: 14,
    radius: 8,
    density: 'comfortable', // compact | comfortable | spacious
    animations: true,
  },
  accessibility: {
    fontScale: 100,
    highContrast: false,
    reducedMotion: false,
    keyboardNav: true,
  },
  privacy: {
    maskLivingInExports: false,
    hideLivingDatesOnCards: false,
    storage: 'persistent', // persistent | session
    imageMaxSize: 640,
    imageQuality: 0.85,
  },
  profile: {
    signedIn: false,
    name: '',
    email: '',
  },
};

export const DATE_FORMATS = [
  { id: 'D MMM YYYY', example: '4 Mar 1952' },
  { id: 'MMM D, YYYY', example: 'Mar 4, 1952' },
  { id: 'DD/MM/YYYY', example: '04/03/1952' },
  { id: 'MM/DD/YYYY', example: '03/04/1952' },
  { id: 'YYYY-MM-DD', example: '1952-03-04' },
  { id: 'D MMMM YYYY', example: '4 March 1952' },
];

export const LOCALES = [
  { id: 'en-GB', label: 'English (United Kingdom)' },
  { id: 'en-US', label: 'English (United States)' },
  { id: 'en-IN', label: 'English (India)' },
  { id: 'en-AU', label: 'English (Australia)' },
];

export const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'unknown', label: 'Unknown' },
];

export const RELATIONSHIP_STATUSES = [
  { id: 'single', label: 'Single' },
  { id: 'married', label: 'Married' },
  { id: 'partnered', label: 'In a partnership' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'divorced', label: 'Divorced' },
  { id: 'separated', label: 'Separated' },
  { id: 'widowed', label: 'Widowed' },
  { id: 'unknown', label: 'Unknown' },
];

export const PARTNER_TYPES = [
  { id: 'married', label: 'Married' },
  { id: 'partner', label: 'Partners' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'divorced', label: 'Divorced' },
  { id: 'separated', label: 'Separated' },
];

export const PARENT_TYPES = [
  { id: 'biological', label: 'Biological' },
  { id: 'adoptive', label: 'Adoptive' },
  { id: 'step', label: 'Step' },
  { id: 'foster', label: 'Foster' },
];
