import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Escape quotes and wrap in quotes if contains comma/quote/newline
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const status = url.searchParams.get("status") || "";
  const payment = url.searchParams.get("payment") || "";
  const q = url.searchParams.get("q") || "";

  const where: Record<string, unknown> = { sellerId: seller.id };
  if (status && status !== "all") where.status = status;
  if (payment && payment !== "all") where.paymentStatus = payment;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { phone: { contains: q } } },
    ];
  }

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: { customer: true },
  });

  const header = [
    "Order #",
    "Date",
    "Customer",
    "Phone",
    "City",
    "Items",
    "Subtotal",
    "Shipping",
    "Discount",
    "Total",
    "Status",
    "Payment Status",
    "Payment Method",
    "Courier",
    "Tracking #",
    "Source",
  ];

  const rows = orders.map((o) => {
    const items = JSON.parse(o.itemsJson) as { name: string; qty: number; price: number }[];
    const itemsSummary = items.map((i) => `${i.qty}x ${i.name}`).join("; ");
    return [
      o.orderNumber,
      o.createdAt.toISOString().slice(0, 19).replace("T", " "),
      o.customer.name,
      o.customer.phone,
      o.customer.city || "",
      itemsSummary,
      o.subtotal,
      o.shipping,
      o.discount,
      o.total,
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      o.courier || "",
      o.trackingNumber || "",
      o.source,
    ].map(csvCell).join(",");
  });

  const csv = [header.map(csvCell).join(","), ...rows].join("\n");
  const bom = "\uFEFF"; // for Excel UTF-8

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ordernama-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
