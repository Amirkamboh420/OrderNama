import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

type Range = "today" | "7d" | "30d" | "all";

const RANGES: Range[] = ["today", "7d", "30d", "all"];

/** Compute the inclusive start of the selected range (local time). */
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

type SeriesPoint = { date: string; label: string; revenue: number; orders: number };

/** Build the time series sized to the requested range. */
function buildSeries(range: Range, now: Date, orders: { total: number; createdAt: Date; status: string; paymentStatus: string }[]): SeriesPoint[] {
  const series: SeriesPoint[] = [];

  if (range === "today") {
    // 12 hourly buckets from start of today to now
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    // last 12 hours OR 12 buckets from 00:00 to current hour (whichever has data)
    const firstHour = Math.max(0, currentHour - 11);
    for (let h = firstHour; h <= currentHour; h++) {
      const bucketStart = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate(), h);
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);
      const dayOrders = orders.filter((o) => o.createdAt >= bucketStart && o.createdAt < bucketEnd);
      const rev = dayOrders
        .filter((o) => o.status !== "Cancelled")
        .reduce((s, o) => s + (o.paymentStatus === "Partial" ? o.total * 0.5 : o.paymentStatus === "Paid" ? o.total : 0), 0);
      series.push({
        date: bucketStart.toISOString().slice(0, 13),
        label: `${String(h).padStart(2, "0")}:00`,
        revenue: Math.round(rev),
        orders: dayOrders.length,
      });
    }
    return series;
  }

  // Daily buckets for 7d / 30d / all
  const days = range === "7d" ? 7 : 30; // 30d & all → 30 days (data only ~30d old anyway)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const dayOrders = orders.filter((o) => o.createdAt >= d && o.createdAt < next);
    const rev = dayOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + (o.paymentStatus === "Partial" ? o.total * 0.5 : o.paymentStatus === "Paid" ? o.total : 0), 0);
    series.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" }),
      revenue: Math.round(rev),
      orders: dayOrders.length,
    });
  }
  return series;
}

export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const rangeParam = url.searchParams.get("range");
  const hasRange = rangeParam && (RANGES as string[]).includes(rangeParam);
  const range: Range | null = hasRange ? (rangeParam as Range) : null;

  const now = new Date();
  // When range is not provided, keep the existing 14-day default so analytics-view is unchanged.
  const effectiveDays = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" || range === "all" ? 30 : 14;
  const seriesStart = range
    ? startOfRange(range, now)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() - (effectiveDays - 1));

  const orders = await db.order.findMany({
    where: { sellerId: seller.id, createdAt: { gte: seriesStart } },
    select: { total: true, createdAt: true, status: true, paymentStatus: true },
  });

  // Time series sized to the range
  let series: SeriesPoint[];
  if (range === "today") {
    series = buildSeries("today", now, orders);
  } else if (range === "7d") {
    series = buildSeries("7d", now, orders);
  } else if (range === "30d" || range === "all") {
    series = buildSeries("30d", now, orders);
  } else {
    // No range provided → existing 14-day behavior
    series = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const dayOrders = orders.filter((o) => o.createdAt >= d && o.createdAt < next);
      const rev = dayOrders
        .filter((o) => o.status !== "Cancelled")
        .reduce((s, o) => s + (o.paymentStatus === "Partial" ? o.total * 0.5 : o.paymentStatus === "Paid" ? o.total : 0), 0);
      series.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" }),
        revenue: Math.round(rev),
        orders: dayOrders.length,
      });
    }
  }

  // Status breakdown — filtered to the range when range is provided; all-time otherwise (backward compat)
  const statusFilter = range ? { createdAt: { gte: startOfRange(range, now) } } : {};
  const statusOrders = await db.order.findMany({
    where: { sellerId: seller.id, ...statusFilter },
    select: { status: true, total: true, paymentStatus: true },
  });
  const byStatus: Record<string, { count: number; revenue: number }> = {};
  for (const o of statusOrders) {
    byStatus[o.status] = byStatus[o.status] || { count: 0, revenue: 0 };
    byStatus[o.status].count += 1;
    if (o.status !== "Cancelled") {
      byStatus[o.status].revenue += o.paymentStatus === "Partial" ? o.total * 0.5 : o.paymentStatus === "Paid" ? o.total : 0;
    }
  }

  // Payment method breakdown — keep all-time (used by analytics-view, no range param)
  const allOrders = await db.order.findMany({
    where: { sellerId: seller.id },
    select: { paymentMethod: true, status: true, paymentStatus: true, itemsJson: true },
  });
  const byMethod: Record<string, number> = {};
  for (const o of allOrders) {
    byMethod[o.paymentMethod as keyof typeof byMethod] = (byMethod[o.paymentMethod as keyof typeof byMethod] || 0) + 1;
  }

  // Top selling items — all-time (analytics-view)
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const o of allOrders) {
    if (o.status === "Cancelled") continue;
    const items = JSON.parse(o.itemsJson) as { name: string; qty: number; price: number }[];
    for (const it of items) {
      const key = it.name;
      itemMap[key] = itemMap[key] || { name: it.name, qty: 0, revenue: 0 };
      itemMap[key].qty += it.qty;
      itemMap[key].revenue += it.qty * it.price;
    }
  }
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Repeat customers — all-time (analytics-view)
  const repeatCustomers = await db.customer.count({ where: { sellerId: seller.id, isRepeat: true } });

  // Month-over-month growth — all-time (analytics-view)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthOrders = await db.order.count({ where: { sellerId: seller.id, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } });
  const thisMonthOrders = await db.order.count({ where: { sellerId: seller.id, createdAt: { gte: startOfMonth } } });
  const growth = lastMonthOrders === 0 ? 100 : Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100);

  return NextResponse.json({
    series,
    byStatus,
    byMethod,
    topItems,
    repeatCustomers,
    momGrowth: growth,
    ...(range ? { range } : {}),
  });
}
