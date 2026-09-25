import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/customers/segments
// Returns customer segmentation by tags + repeat status for the dashboard widget
export async function GET() {
  const seller = await requireSeller();
  const customers = await db.customer.findMany({
    where: { sellerId: seller.id },
    select: { tags: true, isRepeat: true, totalOrders: true, totalSpent: true },
  });

  // Tag-based segments
  const tagSegments: Record<string, { count: number; revenue: number }> = {};
  let newCount = 0;
  let repeatCount = 0;
  let vipCount = 0;

  for (const c of customers) {
    const tags = (c.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      // Untagged → "Other"
      tagSegments["Other"] = tagSegments["Other"] || { count: 0, revenue: 0 };
      tagSegments["Other"].count++;
      tagSegments["Other"].revenue += c.totalSpent;
    } else {
      for (const t of tags) {
        tagSegments[t] = tagSegments[t] || { count: 0, revenue: 0 };
        tagSegments[t].count++;
        tagSegments[t].revenue += c.totalSpent;
      }
    }
    if (c.isRepeat) repeatCount++;
    else newCount++;
    if (tags.includes("VIP")) vipCount++;
  }

  // Sort by count desc
  const segments = Object.entries(tagSegments)
    .map(([tag, data]) => ({ tag, ...data }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    segments,
    totals: {
      new: newCount,
      repeat: repeatCount,
      vip: vipCount,
      total: customers.length,
    },
  });
}
