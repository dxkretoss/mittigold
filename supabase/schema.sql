-- ==============================================================================
-- MITTIGOLD DISTRIBUTION PORTAL — SUPABASE SCHEMA & SEED SCRIPT
-- Client: FarmFlow Foods Pvt. Ltd. (MittiGold)
-- Execute this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gsddmpgpccwnwnuklhqp/sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES / USERS TABLE & AUTH
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'sales', 'distributor', 'broker')),
    company TEXT DEFAULT 'FarmFlow Foods Pvt. Ltd.',
    initials TEXT,
    phone TEXT,
    city TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert profiles" ON public.profiles;
CREATE POLICY "Allow anon insert profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update profiles" ON public.profiles;
CREATE POLICY "Allow anon update profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (true);

-- Custom RPC Auth Function
CREATE OR REPLACE FUNCTION public.custom_login(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT * INTO v_user
    FROM public.profiles
    WHERE LOWER(email) = LOWER(TRIM(p_email))
      AND password = p_password
      AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid email or password.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'name', v_user.name,
            'role', v_user.role,
            'company', v_user.company,
            'initials', v_user.initials,
            'phone', v_user.phone,
            'city', v_user.city
        )
    );
END;
$$;

-- Seed Admin Credential
INSERT INTO public.profiles (email, password, name, role, company, initials, phone, city)
VALUES 
    ('admin@mittigold.com', 'LJMIttiFWl34zObr2xPn', 'Ankur K.', 'admin', 'FarmFlow Foods Pvt. Ltd.', 'AK', '+91 98250 11001', 'Ahmedabad')
ON CONFLICT (email) DO UPDATE 
SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company = EXCLUDED.company,
    initials = EXCLUDED.initials,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE (9 SKUs MASTER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pack TEXT NOT NULL,
    price TEXT NOT NULL,
    stock INTEGER DEFAULT 80,
    stock_qty INTEGER DEFAULT 100,
    "on" BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing installations:
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 100;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read products" ON public.products;
CREATE POLICY "Allow anon read products" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert products" ON public.products;
CREATE POLICY "Allow anon insert products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update products" ON public.products;
CREATE POLICY "Allow anon update products" ON public.products FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete products" ON public.products;
CREATE POLICY "Allow anon delete products" ON public.products FOR DELETE TO anon, authenticated USING (true);

-- Seed 9 SKUs into Products table
INSERT INTO public.products (name, pack, price, stock, stock_qty, "on")
VALUES 
    ('Chakki Fresh Atta', '5 kg', '₹245', 82, 450, true),
    ('Chakki Fresh Atta', '7 kg', '₹335', 64, 320, true),
    ('Chakki Fresh Atta', '10 kg', '₹470', 71, 280, true),
    ('Chakki Fresh Atta', '30 kg', '₹1,340', 38, 150, true),
    ('Bhakhri Atta', '5 kg', '₹260', 55, 200, true),
    ('Bhakhri Atta', '30 kg', '₹1,420', 22, 60, false),
    ('Maida', '30 kg', '₹1,100', 47, 190, true),
    ('Rava', '30 kg', '₹1,180', 60, 210, true),
    ('Sooji', '30 kg', '₹1,150', 12, 45, true)
ON CONFLICT DO NOTHING;
-- ------------------------------------------------------------------------------
-- 3. COMPANY / INVOICE SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'MittiGold Distribution',
    legal TEXT DEFAULT 'FarmFlow Foods Pvt. Ltd.',
    gstin TEXT DEFAULT '24AAAFF1234A1Z5',
    address TEXT DEFAULT 'Survey No. 142, GIDC Estate, South Bopal, Ahmedabad, Gujarat 380058',
    email TEXT DEFAULT 'accounts@farmflowfoods.in',
    phone TEXT DEFAULT '+91 90000 11223',
    default_gst INTEGER DEFAULT 5,
    invoice_prefix TEXT DEFAULT 'MG-INV-',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read company_settings" ON public.company_settings;
CREATE POLICY "Allow anon read company_settings" ON public.company_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert company_settings" ON public.company_settings;
CREATE POLICY "Allow anon insert company_settings" ON public.company_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update company_settings" ON public.company_settings;
CREATE POLICY "Allow anon update company_settings" ON public.company_settings FOR UPDATE TO anon, authenticated USING (true);

-- Seed Default Company / Invoice Settings Row
INSERT INTO public.company_settings (id, name, legal, gstin, address, email, phone, default_gst, invoice_prefix)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'MittiGold Distribution',
    'FarmFlow Foods Pvt. Ltd.',
    '24AAAFF1234A1Z5',
    'Survey No. 142, GIDC Estate, South Bopal, Ahmedabad, Gujarat 380058',
    'accounts@farmflowfoods.in',
    '+91 90000 11223',
    5,
    'MG-INV-'
)
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    legal = EXCLUDED.legal,
    gstin = EXCLUDED.gstin,
    address = EXCLUDED.address,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    default_gst = EXCLUDED.default_gst,
    invoice_prefix = EXCLUDED.invoice_prefix,
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 4. INVOICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    dist TEXT NOT NULL,
    amt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'unpaid')),
    date TEXT NOT NULL,
    gst_rate INTEGER DEFAULT 5,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read invoices" ON public.invoices;
CREATE POLICY "Allow anon read invoices" ON public.invoices FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert invoices" ON public.invoices;
CREATE POLICY "Allow anon insert invoices" ON public.invoices FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update invoices" ON public.invoices;
CREATE POLICY "Allow anon update invoices" ON public.invoices FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete invoices" ON public.invoices;
CREATE POLICY "Allow anon delete invoices" ON public.invoices FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Invoices
INSERT INTO public.invoices (id, dist, amt, status, date, gst_rate, items)
VALUES 
    ('MG-INV-00231', 'Ramesh Trading Co.', '₹81,585', 'pending', '03 Aug 2026', 5, '[{"name":"Chakki Fresh Atta","pack":"30 kg","qty":"40 bags","amount":52000},{"name":"Maida","pack":"30 kg","qty":"15 bags","amount":16500},{"name":"Sooji","pack":"30 kg","qty":"10 bags","amount":9200}]'::jsonb),
    ('MG-INV-00230', 'Shree Umiya Traders', '₹34,900', 'paid', '29 Jul 2026', 5, '[{"name":"Bhakhri Atta","pack":"30 kg","qty":"22 bags","amount":31240}]'::jsonb),
    ('MG-INV-00229', 'Patel Distributors', '₹22,150', 'paid', '27 Jul 2026', 5, '[{"name":"Maida","pack":"30 kg","qty":"18 bags","amount":19800}]'::jsonb),
    ('MG-INV-00228', 'Anand Agro Supplies', '₹58,300', 'pending', '24 Jul 2026', 5, '[{"name":"Chakki Fresh Atta","pack":"30 kg","qty":"40 bags","amount":53600}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. DISTRIBUTORS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.distributors (
    id TEXT PRIMARY KEY DEFAULT ('dist-' || gen_random_uuid()),
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    target INTEGER DEFAULT 80,
    outstanding TEXT DEFAULT '₹0',
    pay TEXT DEFAULT 'paid' CHECK (pay IN ('paid', 'unpaid')),
    phone TEXT,
    gstin TEXT,
    billing TEXT,
    reference_type TEXT DEFAULT 'company',
    reference_id TEXT,
    reference_name TEXT DEFAULT 'Company Own',
    payment_proof TEXT,
    payment_date TEXT,
    payment_mode TEXT DEFAULT 'UPI / QR',
    payment_ref TEXT,
    payment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing installations:
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS reference_type TEXT DEFAULT 'company';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS reference_name TEXT DEFAULT 'Company Own';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_proof TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_date TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'UPI / QR';
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.distributors ADD COLUMN IF NOT EXISTS payment_notes TEXT;

ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read distributors" ON public.distributors;
CREATE POLICY "Allow anon read distributors" ON public.distributors FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert distributors" ON public.distributors;
CREATE POLICY "Allow anon insert distributors" ON public.distributors FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update distributors" ON public.distributors;
CREATE POLICY "Allow anon update distributors" ON public.distributors FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete distributors" ON public.distributors;
CREATE POLICY "Allow anon delete distributors" ON public.distributors FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Distributors
INSERT INTO public.distributors (id, name, zone, city, area, target, outstanding, pay, gstin, billing, reference_type, reference_name)
VALUES 
    ('dist-1', 'Ramesh Trading Co.', 'South Gujarat', 'Surat', 'Adajan', 92, '₹45,200', 'unpaid', '24ABCPT4567F1Z2', '12, Adajan Patiya, Ring Road, Surat, Gujarat 395009', 'broker', 'J. Mehta Associates'),
    ('dist-2', 'Shree Umiya Traders', 'Central Gujarat', 'Ahmedabad', 'Bopal', 105, '₹0', 'paid', '24AAEPU9081C1ZH', 'Shop 4, Bopal Cross Road, Ahmedabad, Gujarat 380058', 'company', 'Company Own'),
    ('dist-3', 'Patel Distributors', 'North Gujarat', 'Mehsana', 'Highway Rd', 78, '₹12,000', 'unpaid', '24AAFPP2233D1Z9', 'Highway Road, Near Bus Stand, Mehsana, Gujarat 384002', 'broker', 'Solanki Agency'),
    ('dist-4', 'Saurashtra Foods', 'Saurashtra', 'Rajkot', 'Kalawad Rd', 61, '₹28,500', 'unpaid', '24AAGPS5566E1Z4', 'Kalawad Road, Rajkot, Gujarat 360005', 'company', 'Company Own'),
    ('dist-5', 'Anand Agro Supplies', 'Central Gujarat', 'Anand', 'Vidyanagar', 88, '₹6,400', 'paid', '24AAHPA7788G1Z1', 'Vidyanagar Char Rasta, Anand, Gujarat 388120', 'employee', 'Vikram Patel'),
    ('dist-6', 'Navsari Wholesale', 'South Gujarat', 'Navsari', 'Station Rd', 70, '₹19,100', 'unpaid', '24AAJPN3344H1Z6', 'Station Road, Near Railway Crossing, Navsari, Gujarat 396445', 'broker', 'J. Mehta Associates')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. BROKERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brokers (
    id TEXT PRIMARY KEY DEFAULT ('broker-' || gen_random_uuid()),
    name TEXT NOT NULL,
    phone TEXT,
    rate NUMERIC DEFAULT 5,
    orders INTEGER DEFAULT 0,
    commission TEXT DEFAULT '₹0',
    paid TEXT DEFAULT '₹0',
    pending TEXT DEFAULT '₹0',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read brokers" ON public.brokers;
CREATE POLICY "Allow anon read brokers" ON public.brokers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert brokers" ON public.brokers;
CREATE POLICY "Allow anon insert brokers" ON public.brokers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update brokers" ON public.brokers;
CREATE POLICY "Allow anon update brokers" ON public.brokers FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete brokers" ON public.brokers;
CREATE POLICY "Allow anon delete brokers" ON public.brokers FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Brokers
INSERT INTO public.brokers (id, name, phone, rate, orders, commission, paid, pending)
VALUES 
    ('broker-1', 'J. Mehta Associates', '+91 98250 11002', 5, 142, '₹21,600', '₹18,400', '₹3,200'),
    ('broker-2', 'Solanki Agency', '+91 98251 22003', 5, 98, '₹11,760', '₹11,760', '₹0'),
    ('broker-3', 'Chirag Brokers', '+91 98252 33004', 5, 64, '₹8,050', '₹5,000', '₹3,050')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. ZONES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    zone_number INT NOT NULL,
    name TEXT NOT NULL,
    cities JSONB NOT NULL DEFAULT '[]'::jsonb,
    pct NUMERIC DEFAULT 0,
    sales TEXT DEFAULT '₹0',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read zones" ON public.zones;
CREATE POLICY "Allow anon read zones" ON public.zones FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert zones" ON public.zones;
CREATE POLICY "Allow anon insert zones" ON public.zones FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update zones" ON public.zones;
CREATE POLICY "Allow anon update zones" ON public.zones FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete zones" ON public.zones;
CREATE POLICY "Allow anon delete zones" ON public.zones FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial 4 Predefined Zones
INSERT INTO public.zones (id, zone_number, name, cities, pct, sales) VALUES
('zone-1', 1, 'South Gujarat', '[["Surat", 6], ["Navsari", 3], ["Valsad", 2]]'::jsonb, 34, '₹54,730'),
('zone-2', 2, 'North Gujarat', '[["Mehsana", 4], ["Palanpur", 2], ["Patan", 2]]'::jsonb, 22, '₹35,410'),
('zone-3', 3, 'Central Gujarat', '[["Ahmedabad", 8], ["Gandhinagar", 3], ["Anand", 2]]'::jsonb, 29, '₹46,680'),
('zone-4', 4, 'Saurashtra', '[["Rajkot", 5], ["Jamnagar", 2], ["Bhavnagar", 2]]'::jsonb, 15, '₹24,160')
ON CONFLICT (id) DO UPDATE SET
    zone_number = EXCLUDED.zone_number,
    name = EXCLUDED.name,
    cities = EXCLUDED.cities,
    pct = EXCLUDED.pct,
    sales = EXCLUDED.sales;

-- ------------------------------------------------------------------------------
-- 8. LEADS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY DEFAULT ('lead-' || gen_random_uuid()),
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'followup', 'convert', 'close')),
    owner TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    last TEXT DEFAULT 'Today',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read leads" ON public.leads;
CREATE POLICY "Allow anon read leads" ON public.leads FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert leads" ON public.leads;
CREATE POLICY "Allow anon insert leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update leads" ON public.leads;
CREATE POLICY "Allow anon update leads" ON public.leads FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete leads" ON public.leads;
CREATE POLICY "Allow anon delete leads" ON public.leads FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Leads
INSERT INTO public.leads (id, name, zone, stage, owner, phone, last) VALUES
('lead-1', 'Vraj Kirana Store', 'South Gujarat', 'new', 'R. Joshi', '+91 98250 44101', 'Today'),
('lead-2', 'Om Sai Traders', 'Central Gujarat', 'followup', 'K. Patel', '+91 98251 55202', '1 day ago'),
('lead-3', 'Ganesh Provision', 'North Gujarat', 'convert', 'R. Joshi', '+91 98252 66303', '3 days ago'),
('lead-4', 'Siddhi General Store', 'Saurashtra', 'new', 'M. Shah', '+91 98253 77404', 'Today'),
('lead-5', 'Krishna Wholesale', 'Central Gujarat', 'close', 'K. Patel', '+91 98254 88505', '1 week ago'),
('lead-6', 'Radhe Kirana', 'South Gujarat', 'followup', 'M. Shah', '+91 98255 99606', '2 days ago')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || gen_random_uuid()),
    type TEXT NOT NULL DEFAULT 'order' CHECK (type IN ('order', 'lead', 'payment', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '/orders',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read notifications" ON public.notifications;
CREATE POLICY "Allow anon read notifications" ON public.notifications FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert notifications" ON public.notifications;
CREATE POLICY "Allow anon insert notifications" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update notifications" ON public.notifications;
CREATE POLICY "Allow anon update notifications" ON public.notifications FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete notifications" ON public.notifications;
CREATE POLICY "Allow anon delete notifications" ON public.notifications FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Notifications
INSERT INTO public.notifications (id, type, title, message, link, read, created_at) VALUES
('notif-1', 'order', 'New Order Received', 'Navsari Wholesale placed order MG-2026-0232 for 980 bags.', '/orders', false, now() - INTERVAL '15 minutes'),
('notif-2', 'lead', 'New Lead Added', 'Vraj Kirana Store from South Gujarat was added by R. Joshi.', '/leads', false, now() - INTERVAL '2 hours'),
('notif-3', 'payment', 'Payment Cleared', 'Shree Umiya Traders payment proof verified and marked as Paid.', '/distributors', false, now() - INTERVAL '4 hours'),
('notif-4', 'order', 'Order Dispatched', 'Order MG-2026-0230 is out for delivery via Tata Ace.', '/orders', true, now() - INTERVAL '1 day'),
('notif-5', 'lead', 'Lead Converted', 'Ganesh Provision moved to Convert stage.', '/leads', true, now() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    dist TEXT NOT NULL,
    zone TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total TEXT,
    qty TEXT,
    original_qty TEXT,
    original_items JSONB,
    eta TEXT,
    transport TEXT DEFAULT '—',
    amt NUMERIC,
    order_value TEXT,
    is_adjusted BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dispatched', 'delivered', 'cancelled')),
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrations for existing installations:
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS eta TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transport TEXT DEFAULT '—';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amt NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_value TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_adjusted BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS original_qty TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS original_items JSONB;

-- Relax any strict legacy NOT NULL constraints on orders columns
ALTER TABLE public.orders ALTER COLUMN date DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN zone DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN eta DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN transport DROP NOT NULL;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read orders" ON public.orders;
CREATE POLICY "Allow anon read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;
CREATE POLICY "Allow anon insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update orders" ON public.orders;
CREATE POLICY "Allow anon update orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete orders" ON public.orders;
CREATE POLICY "Allow anon delete orders" ON public.orders FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Orders
INSERT INTO public.orders (id, dist, zone, items, total, qty, status, date) VALUES
('MG-2026-0232', 'Navsari Wholesale', 'South Gujarat', '[{"name":"Chakki Fresh Atta","pack":"30 kg","qty":30,"price":1340,"amount":40200},{"name":"Maida","pack":"30 kg","qty":20,"price":1100,"amount":22000}]'::jsonb, '₹62,200', '50 bags', 'pending', '03 Aug 2026'),
('MG-2026-0231', 'Ramesh Trading Co.', 'South Gujarat', '[{"name":"Chakki Fresh Atta","pack":"30 kg","qty":40,"price":1300,"amount":52000},{"name":"Maida","pack":"30 kg","qty":15,"price":1100,"amount":16500}]'::jsonb, '₹68,500', '55 bags', 'approved', '01 Aug 2026'),
('MG-2026-0230', 'Shree Umiya Traders', 'Central Gujarat', '[{"name":"Bhakhri Atta","pack":"30 kg","qty":22,"price":1420,"amount":31240}]'::jsonb, '₹31,240', '22 bags', 'dispatched', '29 Jul 2026'),
('MG-2026-0229', 'Patel Distributors', 'North Gujarat', '[{"name":"Maida","pack":"30 kg","qty":18,"price":1100,"amount":19800}]'::jsonb, '₹19,800', '18 bags', 'delivered', '27 Jul 2026')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 11. EMPLOYEES / SALES ROSTER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY DEFAULT ('emp-' || gen_random_uuid()),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Field Sales Officer',
    zone TEXT DEFAULT 'South Gujarat',
    city TEXT DEFAULT '',
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    target_bags NUMERIC DEFAULT 500000,
    achieved_bags NUMERIC DEFAULT 0,
    leads_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
    joined_date TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read employees" ON public.employees;
CREATE POLICY "Allow anon read employees" ON public.employees FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert employees" ON public.employees;
CREATE POLICY "Allow anon insert employees" ON public.employees FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update employees" ON public.employees;
CREATE POLICY "Allow anon update employees" ON public.employees FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon delete employees" ON public.employees;
CREATE POLICY "Allow anon delete employees" ON public.employees FOR DELETE TO anon, authenticated USING (true);

-- Seed Initial Employee
INSERT INTO public.employees (id, name, role, zone, city, phone, email, target_bags, achieved_bags, leads_count, status, joined_date) VALUES
('emp-1', 'Ramesh Joshi', 'Field Sales Officer', 'South Gujarat', 'Surat', '+91 98250 44101', 'ramesh@farmflowfoods.in', 500000, 240000, 12, 'active', '01 Jan 2026')
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';



