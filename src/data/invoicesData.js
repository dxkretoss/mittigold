export const initialInvoices = [
  {
    id: "MG-INV-00231",
    dist: "Ramesh Trading Co.",
    amt: "₹81,585",
    status: "pending",
    date: "03 Aug 2026",
    gstRate: 5,
    items: [
      { name: "Chakki Fresh Atta", pack: "30 kg", qty: "40 bags", amount: 52000 },
      { name: "Maida", pack: "30 kg", qty: "15 bags", amount: 16500 },
      { name: "Sooji", pack: "30 kg", qty: "10 bags", amount: 9200 },
    ]
  },
  { id: "MG-INV-00230", dist: "Shree Umiya Traders", amt: "₹34,900", status: "paid", date: "29 Jul 2026" },
  { id: "MG-INV-00229", dist: "Patel Distributors", amt: "₹22,150", status: "paid", date: "27 Jul 2026" },
  { id: "MG-INV-00228", dist: "Anand Agro Supplies", amt: "₹58,300", status: "pending", date: "24 Jul 2026" },
];
