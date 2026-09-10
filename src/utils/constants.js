export const STAGE_LABELS = {
  new: "New",
  followup: "Follow-up",
  convert: "Convert",
  close: "Close",
};

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

export const INVOICE_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  unpaid: "Unpaid",
};

export const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
      { key: "zones", label: "Zones", path: "/zones", icon: "MapPin" },
    ]
  },
  {
    group: "Sales",
    items: [
      { key: "leads", label: "Leads", path: "/leads", icon: "Users" },
      { key: "distributors", label: "Distributors", path: "/distributors", icon: "Building2" },
      { key: "brokers", label: "Brokers", path: "/brokers", icon: "UserCheck" },
      { key: "salesmen", label: "Employee / Sales", path: "/sales-team", icon: "UserCog" },
    ]
  },
  {
    group: "Operations",
    items: [
      { key: "orders", label: "Orders", path: "/orders", icon: "Package" },
      { key: "invoices", label: "Invoices", path: "/invoices", icon: "FileText" },
      { key: "products", label: "Products", path: "/products", icon: "Layers" },
    ]
  },
  {
    group: "Admin",
    items: [
      { key: "settings", label: "Settings", path: "/settings", icon: "Settings" },
    ]
  }
];

export const PAGE_TITLES = {
  "/dashboard": { title: "Dashboard", sub: "Sales overview and today's operations" },
  "/zones": { title: "Zones", sub: "4 predefined zones — South, North, Central Gujarat & Saurashtra" },
  "/leads": { title: "Leads", sub: "New → Follow-up → Convert → Close" },
  "/distributors": { title: "Distributors", sub: "Directory, outstanding & zone assignment" },
  "/brokers": { title: "Brokers", sub: "Commission & performance" },
  "/sales-team": { title: "Employee / Sales", sub: "Field sales team, zone assignments & monthly targets" },
  "/orders": { title: "Orders", sub: "Admin / Plant Manager queue" },
  "/invoices": { title: "Invoices", sub: "Create + download / share" },
  "/products": { title: "Products", sub: "9 SKUs across 5 product lines" },
  "/settings": { title: "Settings", sub: "Invoice details & account security" },
  "/notifications": { title: "Notifications", sub: "Operational alerts, new orders & lead activities" },
};
