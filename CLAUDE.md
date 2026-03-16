# CLAUDE.md — Andrea Boen Wine Relations

## Overview

Wine industry CRM built with React+Vite. Two views: public landing page with multi-step contact form, and admin dashboard with interactive Leaflet map + filterable sidebar. No backend — data persisted in localStorage.

## Commands

```bash
npm run dev      # Dev server (port 5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Component Architecture

- `App.jsx` — Router: shows `AdminMap` if admin logged in, otherwise `ClientLanding`
- `ClientLanding.jsx` — Landing page with vineyard background, zoom animation, CTA button
- `ZoomAnimation.jsx` — Dark Leaflet map that flies from world to Italy with HD GeoJSON overlay. Uses sessionStorage to show only once
- `ContactForm.jsx` — 4-step form: sector (Wine/Spirits) → company → clickable map with Nominatim reverse geocoding → contact details. Saves to localStorage key `clientContacts`
- `Login.jsx` — Hardcoded credentials: `andrea` / `admin2025`
- `AdminMap.jsx` — Sidebar with search + country/city filters + contact list. Leaflet map with markers. Sidebar click → flyTo. Uses `FitBounds` and `MapController` as internal sub-components
- `MarkerPopup.jsx` — Leaflet popup with contact details
- `Logo.jsx` — Inline SVG with grape cluster, text "ANDREA BOEN" + "Wine Relations"

## Data

- `src/data/points.js` — 67 initial contacts (Veneto, FVG, Slovenia, worldwide). Each contact: id, lat, lng, country, city, company, firstName, lastName, phone, email, role
- `src/data/italy-geo.json` — GeoJSON MultiPolygon of Italian borders (72KB), used in ZoomAnimation
- localStorage key `clientContacts` — JSON array of contacts submitted via client form

## Styling

Pure CSS in `App.css` (~900 lines). BEM-like naming (`.sidebar__item--active`). No CSS modules, no Tailwind.

Palette: wine `#722F37`, gold `#C5A572`, cream `#FFF8F0`, black `#1a1a1a`.
Fonts: Playfair Display (serif, headings), Inter (sans-serif, body). Loaded from Google Fonts in `index.html`.

## Conventions

- Functional React components with hooks
- State managed with useState/useMemo, no external state manager
- Leaflet marker icons loaded from cdnjs CDN (no local assets)
- Map tiles: CartoDB `light_all` for admin, `dark_all` for zoom animation
- New contact markers use CSS class `client-marker` with hue-rotate filter

## Adding initial contacts

Add objects to `src/data/points.js` array. Structure:
```js
{
  id: <unique number>,
  lat: 45.1234, lng: 12.5678,
  country: "Italia", city: "Verona",
  company: "Winery Name",
  firstName: "Mario", lastName: "Rossi",
  phone: "+39 045 123 4567",
  email: "m.rossi@winery.it",
  role: "Export Manager"
}
```

## Adding steps to the contact form

In `ContactForm.jsx` the form is managed with a `step` state (1-4). To add a step:
1. Increment the step numbers of subsequent steps
2. Add a `{step === N && ( ... )}` block in the JSX
3. Wire Back/Next buttons with `setStep(N-1)` and `setStep(N+1)`
4. Add any new fields to the `form` state object
