import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsddmpgpccwnwnuklhqp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZGRtcGdwY2N3bndudWtsaHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDg2NDIsImV4cCI6MjEwMzM4NDY0Mn0.lQ_I-vQU6wNEZOhDROJg_lGB_BdtNGZ6NFJeCUDjBCs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SEED_USERS = [
  {
    email: 'admin@mittigold.com',
    password: 'LJMIttiFWl34zObr2xPn',
    name: 'Ankur K.',
    role: 'admin',
    company: 'FarmFlow Foods Pvt. Ltd.',
    initials: 'AK',
    phone: '+91 98250 11001',
    city: 'Ahmedabad'
  }
];

export const SEED_PRODUCTS = [
  { name: 'Chakki Fresh Atta', pack: '5 kg', price: '₹245', stock: 82, stock_qty: 450, on: true },
  { name: 'Chakki Fresh Atta', pack: '7 kg', price: '₹335', stock: 64, stock_qty: 320, on: true },
  { name: 'Chakki Fresh Atta', pack: '10 kg', price: '₹470', stock: 71, stock_qty: 280, on: true },
  { name: 'Chakki Fresh Atta', pack: '30 kg', price: '₹1,340', stock: 38, stock_qty: 150, on: true },
  { name: 'Bhakhri Atta', pack: '5 kg', price: '₹260', stock: 55, stock_qty: 200, on: true },
  { name: 'Bhakhri Atta', pack: '30 kg', price: '₹1,420', stock: 22, stock_qty: 60, on: false },
  { name: 'Maida', pack: '30 kg', price: '₹1,100', stock: 47, stock_qty: 190, on: true },
  { name: 'Rava', pack: '30 kg', price: '₹1,180', stock: 60, stock_qty: 210, on: true },
  { name: 'Sooji', pack: '30 kg', price: '₹1,150', stock: 12, stock_qty: 45, on: true }
];

export const SEED_INVOICES = [
  {
    id: "MG-INV-00231",
    dist: "Ramesh Trading Co.",
    amt: "₹81,585",
    status: "pending",
    date: "03 Aug 2026",
    gst_rate: 5,
    items: [
      { name: "Chakki Fresh Atta", pack: "30 kg", qty: "40 bags", amount: 52000 },
      { name: "Maida", pack: "30 kg", qty: "15 bags", amount: 16500 },
      { name: "Sooji", pack: "30 kg", qty: "10 bags", amount: 9200 },
    ]
  },
  { id: "MG-INV-00230", dist: "Shree Umiya Traders", amt: "₹34,900", status: "paid", date: "29 Jul 2026", gst_rate: 5, items: [{ name: "Bhakhri Atta", pack: "30 kg", qty: "22 bags", amount: 31240 }] },
  { id: "MG-INV-00229", dist: "Patel Distributors", amt: "₹22,150", status: "paid", date: "27 Jul 2026", gst_rate: 5, items: [{ name: "Maida", pack: "30 kg", qty: "18 bags", amount: 19800 }] },
  { id: "MG-INV-00228", dist: "Anand Agro Supplies", amt: "₹58,300", status: "pending", date: "24 Jul 2026", gst_rate: 5, items: [{ name: "Chakki Fresh Atta", pack: "30 kg", qty: "40 bags", amount: 53600 }] },
];

async function seed() {
  console.log('🌱 Starting MittiGold Database Seeder (Admin & 9 Products)...');
  console.log(`Target Supabase URL: ${supabaseUrl}`);

  try {
    // 1. Seed Admin User
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .upsert(SEED_USERS, { onConflict: 'email' })
      .select();

    if (userError) {
      console.warn('⚠️ User profile seeding error (check if table exists):', userError.message);
    } else {
      console.log(`✅ Seeded Admin Profile: admin@mittigold.com`);
    }

    // 2. Check and Seed Products Table
    const { data: existingProducts, error: productCheckError } = await supabase
      .from('products')
      .select('id, name, pack')
      .limit(20);

    if (productCheckError) {
      console.warn('\n⚠️  Table "products" does not exist in Supabase yet.');
      console.log('👉 Please execute "supabase/schema.sql" inside your Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/gsddmpgpccwnwnuklhqp/sql\n');
      return;
    }

    if (!existingProducts || existingProducts.length === 0) {
      console.log('📦 Seeding 9 Products into Supabase...');
      const { data: insertedProds, error: insertError } = await supabase
        .from('products')
        .insert(SEED_PRODUCTS)
        .select();

      if (insertError) {
        console.error('❌ Failed to insert products:', insertError.message);
      } else {
        console.log(`✅ Successfully seeded ${insertedProds.length} products into Supabase!`);
      }
    } else {
      console.log(`ℹ️ Products table already has ${existingProducts.length} products.`);
    }

    // 3. Seed Default Company Settings
    const { data: existingSettings } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1);

    if (!existingSettings || existingSettings.length === 0) {
      console.log('⚙️ Seeding default Company Invoice Settings...');
      const { error: settingsError } = await supabase
        .from('company_settings')
        .insert([{
          id: '00000000-0000-0000-0000-000000000001',
          name: 'MittiGold Distribution',
          legal: 'FarmFlow Foods Pvt. Ltd.',
          gstin: '24AAAFF1234A1Z5',
          address: 'Survey No. 142, GIDC Estate, South Bopal, Ahmedabad, Gujarat 380058',
          email: 'accounts@farmflowfoods.in',
          phone: '+91 90000 11223',
          default_gst: 5,
          invoice_prefix: 'MG-INV-'
        }]);

      if (!settingsError) {
        console.log('✅ Seeded Default Company Settings into Supabase!');
      }
    }

    // 4. Seed Invoices Table
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);

    if (!existingInvoices || existingInvoices.length === 0) {
      console.log('🧾 Seeding initial Invoices into Supabase...');
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert(SEED_INVOICES);

      if (!invoiceError) {
        console.log('✅ Seeded Initial Invoices into Supabase!');
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('Fatal seeder error:', err);
  }
}

seed();



