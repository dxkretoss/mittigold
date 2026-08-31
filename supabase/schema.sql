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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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
INSERT INTO public.distributors (id, name, zone, city, area, target, outstanding, pay, gstin, billing)
VALUES 
    ('dist-1', 'Ramesh Trading Co.', 'South Gujarat', 'Surat', 'Adajan', 92, '₹45,200', 'unpaid', '24ABCPT4567F1Z2', '12, Adajan Patiya, Ring Road, Surat, Gujarat 395009'),
    ('dist-2', 'Shree Umiya Traders', 'Central Gujarat', 'Ahmedabad', 'Bopal', 105, '₹0', 'paid', '24AAEPU9081C1ZH', 'Shop 4, Bopal Cross Road, Ahmedabad, Gujarat 380058'),
    ('dist-3', 'Patel Distributors', 'North Gujarat', 'Mehsana', 'Highway Rd', 78, '₹12,000', 'unpaid', '24AAFPP2233D1Z9', 'Highway Road, Near Bus Stand, Mehsana, Gujarat 384002'),
    ('dist-4', 'Saurashtra Foods', 'Saurashtra', 'Rajkot', 'Kalawad Rd', 61, '₹28,500', 'unpaid', '24AAGPS5566E1Z4', 'Kalawad Road, Rajkot, Gujarat 360005'),
    ('dist-5', 'Anand Agro Supplies', 'Central Gujarat', 'Anand', 'Vidyanagar', 88, '₹6,400', 'paid', '24AAHPA7788G1Z1', 'Vidyanagar Char Rasta, Anand, Gujarat 388120'),
    ('dist-6', 'Navsari Wholesale', 'South Gujarat', 'Navsari', 'Station Rd', 70, '₹19,100', 'unpaid', '24AAJPN3344H1Z6', 'Station Road, Near Railway Crossing, Navsari, Gujarat 396445')
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

-- Verification
SELECT * FROM public.zones ORDER BY zone_number;


