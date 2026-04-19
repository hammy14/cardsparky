# Starter Template

A standalone UI template based on the Guided Selling app. No Salesforce connection required.

## What's included
- Full CSS theme (light/dark mode) with brand colors
- MainLayout component (sticky header with tabs, sticky footer)
- Toast notifications
- Sample pages demonstrating: KPI cards, home grid, data table with search/filter, badges, settings placeholder

## Quick start
```bash
cd starter-template
npm install
npm run dev
```

Then open http://localhost:5173

## How to customize
1. Edit `src/App.jsx` to change tabs and pages
2. Edit `src/styles/global.css` to change colors (`:root` variables at the top)
3. Add new pages in `src/pages/`
4. Add new components in `src/components/`

## Available UI patterns
- **KPI cards** — `.kpi-grid` > `.kpi-card`
- **Data tables** — `.opp-section` > `.opp-table`
- **Toolbars** — `.opp-toolbar` with `.opp-search` and `.opp-filter`
- **Toggle groups** — `.toggle-group` > `.toggle-btn`
- **Badges** — `.badge` with inline styles
- **Home cards** — `.home-grid` > `.home-card`
- **Modals** — `.panel-overlay` > `.modal`
- **Side panels** — `.panel-overlay` > `.panel`
- **Toast notifications** — `useToast()` hook
- **Dark mode** — `data-theme="dark"` on `<html>`
