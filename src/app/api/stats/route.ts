import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

type Range = "today" | "7d" | "30d" | "all";

const RANGES: Range[] = ["today", "7d", "30d", "all"];

/** Compute the inclusive start of the selected range (in local time). */
function startOfRange(range: Range, now: Date): Date {
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      // include today → 7-day window ending now
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    case "all":
      // 10 years ago — effectively "all" since seeded data is only ~30 days old
      return new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
  }
}

export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const rangeParam = (url.searchParams.get("range") || "30d") as string;
  const range: Range = (RANGES as string[]).includes(rangeParam) ? (rangeParam as Range) : "30d";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = startOfRange(range, now);

  const [
    orders,
    customers,
    inventory,
    whatsappLogs,
    todayOrders,
    monthOrders,
    pendingOrders,
    unpaidOrders,
    lowStockItems,
    rangeRevenueRows,
    totalRevenueRows,
  ] = await Promise.all([
    db.order.count({ where: { sellerId: seller.id } }),
    db.customer.count({ where: { sellerId: seller.id } }),
    db.inventoryItem.count({ where: { sellerId: seller.id } }),
    db.whatsAppLog.count({ where: { sellerId: seller.id } }),
    // "Today's Orders" — always start of today, regardless of selected range
    db.order.count({ where: { sellerId: seller.id, createdAt: { gte: startOfToday } } }),
    // month-to-date — kept for backward compat (analytics-view, monthly goal widget)
    db.order.count({ where: { sellerId: seller.id, createdAt: { gte: startOfMonth } } }),
    // pending orders within the selected range
    db.order.count({ where: { sellerId: seller.id, status: "Pending", createdAt: { gte: since } } }),
    // unpaid is a current-state metric, not time-bound
    db.order.count({ where: { sellerId: seller.id, paymentStatus: "Unpaid" } }),
    db.inventoryItem.findMany({
      where: { sellerId: seller.id },
      select: { stock: true, lowStockAt: true, name: true, sku: true },
    }),
    // revenue rows inside the selected range
    db.order.findMany({
      where: {
        sellerId: seller.id,
        paymentStatus: { in: ["Paid", "Partial"] },
        createdAt: { gte: since },
      },
      select: { total: true, createdAt: true, status: true, paymentStatus: true },
    }),
    // all-time revenue rows (kept for totalRevenue backward compat)
    db.order.findMany({
      where: { sellerId: seller.id, paymentStatus: { in: ["Paid", "Partial"] } },
      select: { total: true, createdAt: true, status: true, paymentStatus: true },
    }),
  ]);

  // Revenue for the selected timeframe
  const rangeRevenue = rangeRevenueRows
    .filter((r) => r.status !== "Cancelled")
    .reduce((s, r) => s + (r.paymentStatus === "Partial" ? r.total * 0.5 : r.total), 0);

  // All-time revenue (preserved for backward compat)
  const totalRevenue = totalRevenueRows
    .filter((r) => r.status !== "Cancelled")
    .reduce((s, r) => s + (r.paymentStatus === "Partial" ? r.total * 0.5 : r.total), 0);

  // low stock count — current state, not time-bound
  const lowStock = lowStockItems.filter((i) => i.stock <= i.lowStockAt);

  return NextResponse.json({
    orders,
    customers,
    inventory,
    whatsappLogs,
    todayOrders,
    monthOrders,
    pendingOrders,
    unpaidOrders,
    lowStockCount: lowStock.length,
    totalRevenue: Math.round(totalRevenue),
    // rangeRevenue is the new primary field; monthRevenue kept as an alias for backward compat
    rangeRevenue: Math.round(rangeRevenue),
    monthRevenue: Math.round(rangeRevenue),
    range,
    plan: seller.plan,
  });
}
