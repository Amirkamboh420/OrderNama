import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/form-analytics — returns order form view analytics
export async function GET() {
  const seller = await requireSeller();
  const now = new Date();
  const last14 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  const [allViews, recentViews] = await Promise.all([
    db.formView.findMany({
      where: { sellerId: seller.id },
      select: { source: true, createdAt: true },
    }),
    db.formView.findMany({
      where: { sellerId: seller.id, createdAt: { gte: last14 } },
      select: { source: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Total views
  const totalViews = allViews.length;

  // Views by source
  const bySource: Record<string, number> = {};
  for (const v of allViews) {
    bySource[v.source] = (bySource[v.source] || 0) + 1;
  }

  // 14-day series
  const series: { date: string; label: string; views: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const dayViews = recentViews.filter((v) => v.createdAt >= d && v.createdAt < next);
    series.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" }),
      views: dayViews.length,
    });
  }

  // Conversion rate (form views vs orders created via "Form" source)
  const formOrders = await db.order.count({
    where: { sellerId: seller.id, source: "Form" },
  });
  const conversionRate = totalViews > 0 ? Math.round((formOrders / totalViews) * 100) : 0;

  return NextResponse.json({
    totalViews,
    bySource,
    series,
    conversionRate,
    formOrders,
  });
}
