# Family Tree Builder

React + Vite + Tailwind family tree app, with [json-server](https://github.com/typicode/json-server) as a simple backend.

```bash
npm install
npm run dev      # starts the backend (port 3001) and the app (http://localhost:5173)
npm run web      # app only
npm run server   # backend only
npm run build
```

## Backend and saving

- All data is saved to `server/db.json` through json-server. It is created on first start and is git-ignored, so your family data stays private.
  - `trees`: one record per tree (people, relationships, positions, layout)
  - `app`: tree order, active tree, selected person, recent people
  - `settings`: appearance, layout and profile settings
- Edits are sent about 0.4 s after you stop changing things, and only changed trees are sent.
- Every save is also kept in the browser (IndexedDB / localStorage). If the backend is not running the app keeps working and syncs on the next change once the backend is back.
- "This tab only (private)" storage never sends data to the backend.
- In development Vite forwards `/api/*` to `http://localhost:3001`. Set `VITE_API_URL` to point at another server.
- There is no real login: "Sign in" only stores a display name in settings.

## Structure

```
src/
  components/
    layout/        Header, Sidebar, MainCanvas, SearchBox, TreeSwitcher
    family-tree/   FamilyTree (React Flow canvas), PersonCard, RelationshipConnector,
                   TreeControls (floating toolbar), ContextMenu, EmptyTree
    person/        PersonDetails, PersonForm, PersonalTab, BiographyTab, ImageTab,
                   RelativesList, PersonProfile
    settings/      SettingsPanel, TreeSettings (+ drawer), Appearance, General,
                   Data, Privacy, Accessibility
    modals/        AddPerson, ConfirmDelete, Export, Import, TreeName, Account, Shortcuts
    views/         TimelineView, StatisticsView
    ui/            Modal, Controls, Avatar, Popover, Toasts, ErrorBoundary
  store/           familyTreeStore (trees + undo/redo, IndexedDB),
                   settingsStore (localStorage), uiStore (transient)
  services/        relativeService, exportService, storage
  utils/           layout engine, graph, kinship labels, gedcom, dates, stats, timeline
  constants/       themes, defaults, sample data, shortcuts
```

## Data model

- **People** are keyed by ID in `tree.people`.
- **Relationships** are stored as a flat list with only two types:
  - `parent` (source → target, with a `subtype` of biological, adoptive, step or foster)
  - `partner` (with a `status` and dates)

  Every other kinship term, such as grandmother, cousin once removed or sister-in-law, is derived from these in `utils/kinship.js`.
- **Card positions** (`tree.positions`) are kept separately from relationships. They are only used in manual layout mode.
- **Settings** are stored separately from tree data.

The application name is intentionally empty: set `APP_NAME` in `src/components/layout/Header.jsx`.
