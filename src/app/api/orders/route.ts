import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

type Range = "today" | "7d" | "30d" | "all";
const RANGES: Range[] = ["today", "7d", "30d", "all"];

function startOfRange(range: Range, now: Date): Date {
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    case "all":
      return new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
  }
}

export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const status = url.searchParams.get("status") || "";
  const payment = url.searchParams.get("payment") || "";
  const q = url.searchParams.get("q") || "";
  const limit = Number(url.searchParams.get("limit") || "100");
  const sort = url.searchParams.get("sort") || "newest";
  const rangeParam = url.searchParams.get("range");
  const range: Range | null =
    rangeParam && (RANGES as string[]).includes(rangeParam) ? (rangeParam as Range) : null;

  const where: Record<string, unknown> = { sellerId: seller.id };
  if (status && status !== "all") where.status = status;
  if (payment && payment !== "all") where.paymentStatus = payment;
  if (range) where.createdAt = { gte: startOfRange(range, new Date()) };
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { phone: { contains: q } } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "oldest" ? { createdAt: "asc" } :
    sort === "total_high" ? { total: "desc" } :
    sort === "total_low" ? { total: "asc" } :
    { createdAt: "desc" };

  const orders = await db.order.findMany({
    where,
    orderBy,
    take: limit,
    include: { customer: true },
  });

  const data = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: o.total,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    courier: o.courier,
    trackingNumber: o.trackingNumber,
    notes: o.notes,
    source: o.source,
    items: JSON.parse(o.itemsJson),
    createdAt: o.createdAt,
    customer: {
      id: o.customer.id,
      name: o.customer.name,
      phone: o.customer.phone,
      city: o.customer.city,
      address: o.customer.address,
    },
  }));

  return NextResponse.json({ orders: data, count: data.length });
}

export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();

  // Find or create customer by phone
  let customer = await db.customer.findFirst({
    where: { sellerId: seller.id, phone: body.customerPhone },
  });
  if (!customer) {
    customer = await db.customer.create({
      data: {
        sellerId: seller.id,
        name: body.customerName,
        phone: body.customerPhone,
        address: body.customerAddress || null,
        city: body.customerCity || null,
        notes: body.customerNotes || null,
        instagram: body.customerInstagram || null,
      },
    });
  } else {
    // Update missing fields
    const updates: Record<string, string | null> = {};
    if (!customer.address && body.customerAddress) updates.address = body.customerAddress;
    if (!customer.city && body.customerCity) updates.city = body.customerCity;
    if (Object.keys(updates).length) {
      customer = await db.customer.update({ where: { id: customer.id }, data: updates });
    }
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = items.reduce((s: number, it: { qty: number; price: number }) => s + it.qty * it.price, 0);
  const shipping = Number(body.shipping) || 0;
  const discount = Number(body.discount) || 0;
  const total = subtotal + shipping - discount;

  // Generate order number
  const count = await db.order.count({ where: { sellerId: seller.id } });
  const orderNumber = `ORD-${1000 + count + 1}`;

  const order = await db.order.create({
    data: {
      sellerId: seller.id,
      customerId: customer.id,
      orderNumber,
      itemsJson: JSON.stringify(items),
      subtotal,
      shipping,
      discount,
      total,
      status: body.status || "Pending",
      paymentStatus: body.paymentStatus || "Unpaid",
      paymentMethod: body.paymentMethod || "COD",
      courier: body.courier || null,
      trackingNumber: body.trackingNumber || null,
      notes: body.notes || null,
      source: body.source || "Manual",
    },
    include: { customer: true },
  });

  // Decrement inventory stock for matched SKUs
  for (const it of items as { sku?: string; qty: number }[]) {
    if (it.sku) {
      const inv = await db.inventoryItem.findFirst({ where: { sellerId: seller.id, sku: it.sku } });
      if (inv) {
        await db.inventoryItem.update({
          where: { id: inv.id },
          data: { stock: { decrement: it.qty }, soldCount: { increment: it.qty } },
        });
      }
    }
  }

  // Auto WhatsApp confirmation log
  const setting = await db.setting.findUnique({ where: { sellerId: seller.id } });
  if (setting?.autoConfirm) {
    await db.whatsAppLog.create({
      data: {
        sellerId: seller.id,
        orderId: order.id,
        toPhone: customer.phone,
        message: `*${seller.businessName}* — Aapka order ${orderNumber} confirm ho gaya hai! Total: Rs ${total}. Shukriya! 🌿`,
        status: "sent",
      },
    });
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    customer: { id: customer.id, name: customer.name, phone: customer.phone },
  });
}
