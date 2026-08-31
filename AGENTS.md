# MittiGold Distribution Portal — Agent Instructions

This is a React + Vite web application for FarmFlow Foods Pvt. Ltd.
Built by Kretoss Technology, Ahmedabad.

---

## Stack

- React 18 + Vite
- JavaScript only (.jsx / .js) — NO TypeScript, NO .ts, NO .tsx files ever
- Tailwind CSS + custom CSS (src/index.css)
- react-router-dom v6
- lucide-react (icons)
- Backend: Supabase (currently mocked with in-memory data stores)
- Deploy: Netlify

---

## Non-Negotiable Rules

1. **No TypeScript** — all files must be .jsx or .js only.
2. **Named exports only** — `export const MyComponent = () => {}`. Never `export default`.
3. **No Supabase in components** — all Supabase (and mock) calls go through `src/services/*.js` only.
4. **No direct `src/data/` imports in components** — always import from `src/services/`.
5. **Preserve the design** — match `d:/mittigold/MittiGold_Portal_Prototype.html` visually. No redesigns.
6. **Hooks from `src/hooks/`** — import `useAuth`, `useToast`, etc. from hooks, not directly from context.

---

## Service Layer Pattern

Every data operation (read or write) must go through a service in `src/services/`.
Services are async, return promises, and simulate network delay.

```js
// WRONG — never in a component
const { data } = await supabase.from('leads').select('*');

// RIGHT — wrap in service, call service from component
// src/services/leadService.js
async function fetchAllLeads() {
  const { data, error } = await supabase.from('leads').select('*');
  if (error) throw new Error(error.message);
  return data;
}
export const leadService = { getAll: fetchAllLeads };
```

---

## Supabase Custom Function Pattern (when wiring live backend)

Create `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

Auth wrapper example — never call `supabase.auth.*` in a component:
```js
// src/services/authService.js
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}
export const authService = { login: signIn, logout: signOut, getCurrentUser: getSession };
```

---

## Project Src Layout

```
src/
  context/    AuthContext.jsx, ToastContext.jsx
  hooks/      useAuth.js, useToast.js, usePagination.js
  data/       *Data.js  (mock seed data — never import in components)
  services/   *Service.js (ALL data access lives here)
  routes/     AppRoutes.jsx, ProtectedRoute.jsx
  pages/      auth/, dashboard/, zones/, leads/, distributors/,
              brokers/, orders/, invoices/, products/, settings/
  components/ layout/, common/, leads/, distributors/, brokers/,
              orders/, invoices/, products/, settings/
  utils/      constants.js, helpers.js
  index.css   (all design tokens + prototype CSS classes)
```

---

## Routes

Public: /login, /forgot-password
Protected: /dashboard, /zones, /leads, /distributors, /brokers,
           /orders, /invoices, /products, /settings
Fallback: /* -> /dashboard

---

## Design Tokens (src/index.css :root)

```
--navy: #122036       --navy-2: #1c3050
--wheat: #C89B3C      --wheat-light: #E7C878
--bg: #F7F5F0         --panel: #FFFFFF
--ink: #1D2430        --ink-soft: #5B6472
--line: #E4E0D6
--green: #3D7A5C      --green-bg: #EAF3EE
--amber: #B9832E      --amber-bg: #FBF1E1
--red: #B2483A        --red-bg: #FAEAE8
```

Fonts: Sora (headings), Inter (body), IBM Plex Mono (IDs/numbers)

---

## Domain Quick Reference

### Zones (4, fixed — never user-created)
Zone 1 South Gujarat: Surat, Navsari, Valsad
Zone 2 North Gujarat: Mehsana, Palanpur, Patan
Zone 3 Central Gujarat: Ahmedabad, Gandhinagar, Anand
Zone 4 Saurashtra: Rajkot, Jamnagar, Bhavnagar

### Products (9 SKUs — FarmFlow product master)
Chakki Fresh Atta: 5kg, 7kg, 10kg, 30kg
Bhakhri Atta: 5kg, 30kg
Maida 30kg | Rava 30kg | Sooji 30kg

### Lead Pipeline: new -> followup -> convert -> close
### Order Status:  pending -> approved -> dispatched -> delivered
### Invoice Status: pending, paid, unpaid

### ID Formats
Order:   MG-2026-XXXX (4-digit padded)
Invoice: MG-INV-XXXX  (4-digit padded)

---

## Component Conventions

- `Modal` props: isOpen, onClose + data props
- `Badge` color map: paid/delivered=green, pending/followup=amber, unpaid/close=red, new/approved=slate
- Form fields: `.f-group` class wrapping `<label>` + `<input>`
- Sidebar logout: icon button in `.sidebar-foot` + Settings page Session card
- For full skill docs see: d:/mittigold/.agents/skills/mittigold-portal/SKILL.md
