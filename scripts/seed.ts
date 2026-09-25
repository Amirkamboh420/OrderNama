// OrderNama seed script
// Run with: bun run scripts/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ITEMS = [
  { name: "Lawn Suit - Gulbahar", sku: "LWN-001", category: "Clothing", stock: 12, lowStockAt: 5, price: 2500 },
  { name: "Embroidered Kurti - Mint", sku: "KRT-014", category: "Clothing", stock: 3, lowStockAt: 5, price: 1800 },
  { name: "Silk Scarf - Emerald", sku: "SCF-220", category: "Accessories", stock: 28, lowStockAt: 8, price: 750 },
  { name: "Cotton Dupatta - Cream", sku: "DUP-101", category: "Clothing", stock: 0, lowStockAt: 5, price: 950 },
  { name: "Handbag - Tote Olive", sku: "BAG-088", category: "Accessories", stock: 7, lowStockAt: 3, price: 3200 },
  { name: "Boutique Earrings - Gold Leaf", sku: "JWL-451", category: "Jewellery", stock: 2, lowStockAt: 4, price: 1200 },
  { name: "Homemade Achar - Mix", sku: "FOD-001", category: "Food", stock: 45, lowStockAt: 10, price: 350 },
  { name: "Cake Jar - Chocolate", sku: "FOD-014", category: "Food", stock: 1, lowStockAt: 5, price: 450 },
];

const CUSTOMERS = [
  { name: "Ayesha Khan", phone: "+923331234567", city: "Karachi", address: "Block 7, Gulshan-e-Iqbal", instagram: "@ayesha.k.styles", notes: "Prefers COD. Repeat buyer.", tags: "VIP,Repeat Buyer", birthday: "1995-09-15" },
  { name: "Fatima Noor", phone: "+923211234567", city: "Lahore", address: "Johar Town, Block H", instagram: "@fatimanoor_closet", notes: "Always pays via JazzCash.", tags: "JazzCash,Repeat Buyer", birthday: "1990-09-22" },
  { name: "Sana Malik", phone: "+923001234567", city: "Islamabad", address: "F-11 Markaz", instagram: "@sana.m.boutique", notes: "Wholesale enquiries.", tags: "Wholesale", birthday: "1988-03-10" },
  { name: "Hira Siddiqui", phone: "+923451234567", city: "Rawalpindi", address: "Saddar, Cantt", notes: "Likes fast delivery.", tags: "Fast Delivery", birthday: "1992-09-28" },
  { name: "Mariam Tariq", phone: "+923091234567", city: "Multan", address: "Bukhari Colony", instagram: "@mariam.t.shop", notes: "", tags: "", birthday: null },
  { name: "Zainab Ali", phone: "+923131234567", city: "Faisalabad", address: "Madina Town", notes: "Repeat customer 3x.", tags: "Repeat Buyer", birthday: "1993-09-05" },
  { name: "Bushra Iqbal", phone: "+923331234999", city: "Karachi", address: "DHA Phase 6", instagram: "@bushra.iqbal", notes: "VIP customer.", tags: "VIP,Wholesale", birthday: "1985-12-18" },
  { name: "Areeba Hussain", phone: "+923201234999", city: "Lahore", address: "DHA Phase 5", notes: "", tags: "", birthday: "1996-09-30" },
  { name: "Nimra Sheikh", phone: "+923451234999", city: "Peshawar", address: "University Town", notes: "", tags: "New", birthday: null },
  { name: "Rabia Anwar", phone: "+923091234999", city: "Quetta", address: "Jinnah Town", notes: "New customer.", tags: "New", birthday: "1991-06-14" },
];

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const PAY_METHODS = ["COD", "JazzCash", "EasyPaisa", "Bank"];
const COURIERS = ["TCS", "Leopards", "CallCourier", "DPD"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number) {
  const now = new Date();
  const d = new Date();
  // Pick a day in the past [0 .. daysBack-1]
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  // Pick a random hour/minute, but clamp to not exceed "now" when day is today
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  const maxHour = isToday ? now.getHours() : 23;
  const maxMinute = isToday && maxHour === now.getHours() ? now.getMinutes() : 59;
  d.setHours(
    Math.min(maxHour, Math.floor(Math.random() * 24)),
    Math.min(maxMinute, Math.floor(Math.random() * 60)),
  );
  // Safety: if still in the future, push back 1 hour
  if (d.getTime() > now.getTime()) {
    d.setTime(now.getTime() - 3600_000);
  }
  return d;
}

async function main() {
  console.log("Seeding OrderNama demo data...");

  await db.formView.deleteMany();
  await db.staff.deleteMany();
  await db.supportTicket.deleteMany();
  await db.whatsAppLog.deleteMany();
  await db.order.deleteMany();
  await db.inventoryItem.deleteMany();
  await db.customer.deleteMany();
  await db.setting.deleteMany();
  await db.seller.deleteMany();

  const seller = await db.seller.create({
    data: {
      businessName: "Gulbahar Boutique",
      ownerName: "Hira Parveen",
      phone: "+923001111222",
      whatsappNumber: "+923001111222",
      email: "hira@gulbahar.pk",
      city: "Karachi",
      plan: "Pro",
      currency: "PKR",
      romanUrdu: true,
    },
  });

  await db.setting.create({
    data: {
      sellerId: seller.id,
      autoConfirm: true,
      autoStatusUpdate: true,
      lowStockAlert: true,
      orderFormSlug: "gulbahar-boutique",
      brandColor: "#1E8C45",
    },
  });

  const inventory: { id: string; sku: string | null; name: string; price: number }[] = [];
  for (const it of ITEMS) {
    const inv = await db.inventoryItem.create({ data: { sellerId: seller.id, ...it } });
    inventory.push({ id: inv.id, sku: inv.sku, name: inv.name, price: inv.price });
  }

  const customers: { id: string; phone: string }[] = [];
  for (const c of CUSTOMERS) {
    const cust = await db.customer.create({ data: { sellerId: seller.id, ...c } });
    customers.push({ id: cust.id, phone: cust.phone });
  }

  let orderCounter = 1001;
  const totalOrders = 48;
  for (let i = 0; i < totalOrders; i++) {
    const cust = pick(customers);
    const numItems = 1 + Math.floor(Math.random() * 3);
    const chosenItems: { name: string; sku?: string; qty: number; price: number }[] = [];
    for (let j = 0; j < numItems; j++) {
      const inv = pick(inventory);
      const qty = 1 + Math.floor(Math.random() * 3);
      chosenItems.push({ name: inv.name, sku: inv.sku ?? undefined, qty, price: inv.price });
    }
    const subtotal = chosenItems.reduce((s, x) => s + x.qty * x.price, 0);
    const shipping = Math.random() > 0.5 ? 200 : 250;
    const discount = Math.random() > 0.8 ? 150 : 0;
    const total = subtotal + shipping - discount;

    let status = pick(STATUSES);
    if (i < 6) status = "Pending";
    else if (i < 14) status = "Confirmed";
    else if (i < 22) status = "Shipped";
    else if (i < 40) status = "Delivered";
    else status = "Cancelled";

    let paymentStatus = "Unpaid";
    if (status === "Delivered") paymentStatus = Math.random() > 0.15 ? "Paid" : "Partial";
    else if (status === "Cancelled") paymentStatus = "Unpaid";
    else paymentStatus = pick(["Paid", "Unpaid", "Partial"]);

    const paymentMethod = pick(PAY_METHODS);
    const courier = status === "Shipped" || status === "Delivered" ? pick(COURIERS) : null;
    const trackingNumber = courier ? `${courier.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000000 + 1000000)}` : null;
    const source = Math.random() > 0.7 ? "Form" : "Manual";
    const notes = Math.random() > 0.8 ? "Customer requested evening delivery." : "";

    const order = await db.order.create({
      data: {
        sellerId: seller.id,
        customerId: cust.id,
        orderNumber: `ORD-${orderCounter++}`,
        itemsJson: JSON.stringify(chosenItems),
        subtotal,
        shipping,
        discount,
        total,
        status,
        paymentStatus,
        paymentMethod,
        courier,
        trackingNumber,
        notes,
        source,
        createdAt: randomDate(30),
      },
    });

    if (status === "Delivered" && (paymentStatus === "Paid" || paymentStatus === "Partial")) {
      await db.customer.update({
        where: { id: cust.id },
        data: { totalOrders: { increment: 1 }, totalSpent: { increment: total }, isRepeat: true },
      });
    }

    if (status !== "Pending" && Math.random() > 0.4) {
      await db.whatsAppLog.create({
        data: {
          sellerId: seller.id,
          orderId: order.id,
          toPhone: cust.phone,
          message: `*Gulbahar Boutique* — Aapka order ${order.orderNumber} status: ${status}. Shukriya!`,
          status: pick(["sent", "delivered", "delivered"]),
        },
      });
    }
  }

  const allOrders = await db.order.findMany({ where: { sellerId: seller.id } });
  const soldMap: Record<string, number> = {};
  for (const o of allOrders) {
    if (o.status === "Cancelled") continue;
    const items = JSON.parse(o.itemsJson) as { sku?: string }[];
    for (const it of items) {
      if (it.sku) soldMap[it.sku] = (soldMap[it.sku] || 0) + 1;
    }
  }
  for (const inv of inventory) {
    if (inv.sku && soldMap[inv.sku]) {
      await db.inventoryItem.update({ where: { id: inv.id }, data: { soldCount: soldMap[inv.sku] } });
    }
  }

  // Seed FormView analytics — simulate form views over the last 14 days
  const formSources = ["direct", "instagram", "whatsapp", "other"];
  for (let i = 0; i < 45; i++) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 14));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    await db.formView.create({
      data: {
        sellerId: seller.id,
        slug: "gulbahar-boutique",
        source: formSources[Math.floor(Math.random() * formSources.length)],
        createdAt: d,
      },
    });
  }

  // Seed Staff members
  const staffMembers = [
    { name: "Saima Helper", phone: "+923331111000", role: "manager", permissions: "orders,customers,inventory,analytics,notifications" },
    { name: "Bilal Delivery", phone: "+923331111001", role: "staff", permissions: "orders,inventory" },
  ];
  for (const s of staffMembers) {
    await db.staff.create({ data: { sellerId: seller.id, ...s, active: true } });
  }

  // Seed Support Tickets
  const tickets = [
    { subject: "WhatsApp automation not working", message: "Mera WhatsApp confirmation message nahi ja raha. Please help.", category: "technical", priority: "high", status: "open" },
    { subject: "Plan upgrade question", message: "Pro plan se Business plan pe kaise upgrade karun?", category: "billing", priority: "normal", status: "in_progress" },
    { subject: "Feature request: Instagram DM integration", message: "Kya hum Instagram DM se bhi orders le sakte hain?", category: "feature_request", priority: "low", status: "open" },
    { subject: "Bulk export not working", message: "CSV export button click karne se kuch nahi hota.", category: "technical", priority: "urgent", status: "resolved" },
  ];
  for (const t of tickets) {
    await db.supportTicket.create({
      data: {
        sellerId: seller.id,
        ...t,
        responses: JSON.stringify([{ from: "seller", message: t.message, at: new Date().toISOString() }]),
      },
    });
  }

  const counts = {
    customers: await db.customer.count(),
    orders: await db.order.count(),
    inventory: await db.inventoryItem.count(),
    whatsappLogs: await db.whatsAppLog.count(),
    staff: await db.staff.count(),
    tickets: await db.supportTicket.count(),
    formViews: await db.formView.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
