---
name: mittigold-portal
description: >
  Complete architecture, coding conventions, Supabase integration patterns,
  data models, service layer rules, and UI standards for the MittiGold
  Distribution Portal (React + Vite, FarmFlow Foods Pvt. Ltd.).
  Activate whenever working on any file inside d:/mittigold/mittigold_react.
---

# MittiGold Distribution Portal — Project Skill

## 1. Project Context

**Client**: FarmFlow Foods Pvt. Ltd., Ahmedabad, Gujarat.
**Product**: MittiGold Distribution Management System.
**Built by**: Kretoss Technology, Ahmedabad.
**Proposal doc**: d:/mittigold/FarmFlow_MittiGold_Proposal.html
**Prototype source**: d:/mittigold/MittiGold_Portal_Prototype.html (canonical design reference)
**Mobile prototype**: d:/mittigold/MittiGold_Mobile_App_Prototype.html (Flutter, 3 roles)

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Web framework | React 18 + Vite |
| Language | JavaScript only (.jsx + .js). NO TypeScript. |
| Styling | Tailwind CSS + custom CSS (src/index.css) |
| Router | react-router-dom v6 |
| Icons | lucide-react |
| Backend (live) | Supabase (PostgreSQL) |
| Deployment | Netlify (public/_redirects already present) |

CRITICAL: Do NOT use TypeScript. Do NOT create .ts or .tsx files.

---

## 3. Project File Structure

src/
  App.jsx, main.jsx, index.css
  context/  AuthContext.jsx, ToastContext.jsx
  hooks/    useAuth.js, useToast.js, usePagination.js
  data/     zonesData.js, distributorsData.js, brokersData.js, leadsData.js,
            ordersData.js, invoicesData.js, productsData.js, dashboardData.js,
            companySettingsData.js
  services/ authService.js, distributorService.js, brokerService.js, leadService.js,
            orderService.js, invoiceService.js, productService.js, zoneService.js,
            dashboardService.js, settingsService.js
  routes/   AppRoutes.jsx, ProtectedRoute.jsx
  pages/    auth/Login.jsx, auth/ForgotPassword.jsx
            dashboard/Dashboard.jsx, zones/Zones.jsx, leads/Leads.jsx
            distributors/Distributors.jsx, brokers/Brokers.jsx, orders/Orders.jsx
            invoices/Invoices.jsx, products/Products.jsx, settings/Settings.jsx
  components/
    layout/   AppLayout.jsx, Sidebar.jsx, MobileSidebar.jsx, Topbar.jsx
    common/   Badge.jsx, Button.jsx, GrainGauge.jsx, Modal.jsx, Pagination.jsx,
              EmptyState.jsx, LoadingState.jsx, ConfirmDialog.jsx
    leads/    LeadsTable.jsx, LeadsKanban.jsx
    distributors/ DistributorsTable.jsx, AddDistributorModal.jsx
    brokers/  BrokersTable.jsx, AddBrokerModal.jsx
    orders/   OrdersTable.jsx, NewOrderModal.jsx
    invoices/ InvoiceList.jsx, InvoiceDocument.jsx, CreateInvoiceModal.jsx
    products/ ProductCard.jsx, ProductModal.jsx
    settings/ InvoiceSettingsForm.jsx, ChangePasswordForm.jsx
  utils/    constants.js, helpers.js

---

## 4. Design System & Visual Rules

Do NOT redesign. Match MittiGold_Portal_Prototype.html exactly.

### CSS Custom Properties (src/index.css :root)
--navy: #122036
--navy-2: #1c3050
--wheat: #C89B3C
--wheat-light: #E7C878
--bg: #F7F5F0
--panel: #FFFFFF
--ink: #1D2430
--ink-soft: #5B6472
--line: #E4E0D6
--green: #3D7A5C / --green-bg: #EAF3EE
--amber: #B9832E / --amber-bg: #FBF1E1
--red: #B2483A / --red-bg: #FAEAE8
--blue: #2563EB

### Typography
Headings: Sora (400,500,600,700,800)
Body: Inter (400,500,600,700)
Monospace: IBM Plex Mono 500 — IDs, order numbers

### Key CSS Classes (defined in src/index.css)
.shell, .sidebar, .brand, .navlist, .navitem, .navitem.active, .navgroup-label,
.sidebar-foot, .userchip, .topbar, .panel, .panel-head, .panel-body, .kpi, .kpirow,
.grid2, .badge, .gfill, .gbar, .btn-primary, .btn-outline, .f-group,
.login-screen, .login-brand, .login-formside, .login-card

### Sidebar Scrollbar
nav.navlist: scrollbar-width: thin; scrollbar-color: rgba(231,200,120,0.25) transparent
::-webkit-scrollbar { width: 4px } with transparent track and gold thumb

---

## 5. Business Domain

### Modules (7 web modules, all require login)
/dashboard   - KPI cards, Best 10 Distributors, Zone Performance, Recent Leads, Orders queue
/zones       - 4 fixed zones with grain-fill gauges + city pills (READ ONLY, never user-created)
/leads       - Kanban + table. Pipeline: new -> followup -> convert -> close
/distributors - Orders, target vs achievement, outstanding, zone assignment
/brokers     - Commission (total, paid, pending), performance reports
/orders      - Admin/Plant Manager only. Receive -> delivery time -> mark delivered
/invoices    - Create + download + share (WhatsApp/email link)
/products    - 9 SKU master. Stock toggle + quantity slider
/settings    - Company/invoice settings + change password + session/logout card

### 4 Fixed Zones (never created via UI, seeded once)
Zone 1 South Gujarat:    Surat, Navsari, Valsad
Zone 2 North Gujarat:    Mehsana, Palanpur, Patan
Zone 3 Central Gujarat:  Ahmedabad, Gandhinagar, Anand
Zone 4 Saurashtra:       Rajkot, Jamnagar, Bhavnagar

Zone performance = roll-up through distributor. Brokers and Orders have NO direct zone field.

### 9 SKUs (FarmFlow product master)
Chakki Fresh Atta: 5kg, 7kg, 10kg, 30kg
Bhakhri Atta: 5kg, 30kg
Maida: 30kg | Rava: 30kg | Sooji: 30kg

### Lead stages: new -> followup -> convert -> close
### Order statuses: pending -> approved -> dispatched -> delivered
### Invoice statuses: pending, paid, unpaid

### Roles
Admin - full web access
Plant Manager - Orders, Invoices, Products
Distributor (mobile) - place/view/edit orders, upload payment, view outstanding
Broker (mobile) - place/view/edit orders, view commission
Salesman (mobile) - attendance, mapping, book orders on behalf of distributor

---

## 6. Service Layer Convention (CRITICAL RULES)

1. ALL data access MUST go through src/services/*.js — never import from src/data/ in components.
2. All service methods are async and return promises.
3. Services use an in-memory store: let xxxStore = [...initialXxx]
4. Simulate latency: await new Promise(resolve => setTimeout(resolve, 300))

Service -> Data mapping:
authService        -> inline DEMO_USER / localStorage
distributorService -> distributorsData.js
brokerService      -> brokersData.js
leadService        -> leadsData.js
orderService       -> ordersData.js
invoiceService     -> invoicesData.js
productService     -> productsData.js
zoneService        -> zonesData.js (read only)
settingsService    -> companySettingsData.js
dashboardService   -> dashboardData.js (read only)

---

## 7. Supabase Integration — Custom Function Pattern

### RULE: Never call Supabase inside a component.
All Supabase calls are wrapped in named async functions inside src/services/*.js

### Setup: src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

### Custom Function Pattern (replacing mock service methods)

// WRONG - calling supabase in component
const { data } = await supabase.from('distributors').select('*');

// RIGHT - wrap in named function inside service, call service from component
async function fetchAllDistributors() {
  const { data, error } = await supabase
    .from('distributors')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
export const distributorService = { getAll: fetchAllDistributors, ... };

### Auth Custom Wrapper
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
export const authService = { login: signIn, logout: signOut, getCurrentUser: getSession };

### Supabase Tables
profiles(id UUID PK ref auth.users, name, role, company, initials)
zones(id, name, pct, sales)
zone_cities(id, zone_id FK, city, distributor_count)
distributors(id, name, city, zone_id FK, area, target, achieved, outstanding, pay, created_at)
brokers(id, name, city, total_orders, total_commission, paid_commission, pending_commission, created_at)
leads(id, name, company, city, stage[new/followup/convert/close], assigned, date, created_at)
products(id, name, pack, price, stock, on BOOLEAN, created_at)
orders(id TEXT PK e.g. MG-2026-0023, distributor, product, qty, status, eta, date, created_at)
order_items(id, order_id FK, product_id FK, product_name, pack, qty, price)
invoices(id TEXT PK e.g. MG-INV-0011, party, amount, status, date, due, created_at)
company_settings(id, company_name, gstin, address, phone, email, bank_name, account_no, ifsc, terms)

### RLS Pattern
Always write named policies:
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_distributors" ON distributors FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_distributors" ON distributors FOR INSERT UPDATE DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

---

## 8. Context & Hooks

AuthContext provides: { user, isAuthenticated, login, logout, loading }
  Use: import { useAuth } from '../hooks/useAuth'

ToastContext provides: { showSuccess, showError, showInfo }
  Use: import { useToast } from '../hooks/useToast'

usePagination(items, pageSize) returns: { page, setPage, totalPages, pageItems }

---

## 9. Routes

Public:    /login, /forgot-password
Protected: /dashboard, /zones, /leads, /distributors, /brokers,
           /orders, /invoices, /products, /settings
Fallback:  /* -> /dashboard

ProtectedRoute.jsx checks isAuthenticated from AuthContext, redirects to /login if false.

---

## 10. Component Conventions

1. Always named exports: export const MyComponent = () => {}
2. Never default exports.
3. Hooks from src/hooks/ only (not directly from context).
4. lucide-react icons only, import individually.
5. Modal props: isOpen, onClose + data props.
6. Form fields: .f-group class with label + input pattern.
7. Badge color mapping:
   paid/active/delivered = green-bg + green text
   pending/followup     = amber-bg + amber text
   unpaid/close         = red-bg + red text
   new/approved         = slate-bg + navy text

---

## 11. Navigation (src/utils/constants.js)

Nav groups in order: Overview -> Sales -> Operations -> Admin
OVERVIEW:   Dashboard (/dashboard), Zones (/zones)
SALES:      Leads (/leads), Distributors (/distributors), Brokers (/brokers)
OPERATIONS: Orders (/orders), Invoices (/invoices), Products (/products)
ADMIN:      Settings (/settings)

Sidebar shows logout icon button next to user chip.
Settings page has Session & Security card with Sign Out button.

---

## 12. Deployment

- Netlify SPA hosting
- public/_redirects: /*    /index.html   200
- Build: npm run build -> dist/
- Env vars (Netlify dashboard): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

---

## 13. Future Mobile App (Flutter — Phase 2)

Single Flutter build with 3 role-based views:
Distributor: place/view/edit order, upload payment, view outstanding
Broker:      place/view/edit order, view outstanding, view commission
Salesman:    attendance, location mapping, book orders for distributor, HR/leave

Order editing locked after Admin/Plant Manager approval — post-approval changes via web only.
Mobile shares same Supabase backend as web dashboard.

---

## 14. Business Rules Summary

1. Zones are fixed (4 zones, seeded once, never UI-created)
2. Products are 9 fixed SKUs (admin can edit stock/price, no free-form creation)
3. Orders restricted to Admin and Plant Manager on web
4. Zone performance derived via distributor rollup (no zone field on broker/order)
5. Commission on brokers: tracked manually (total, paid, pending amounts)
6. Invoices are manual: not auto-generated from orders
7. Logout: available from sidebar footer icon AND Settings > Session card
8. Order ID format: MG-2026-XXXX (padded 4-digit)
9. Invoice ID format: MG-INV-XXXX (padded 4-digit)
