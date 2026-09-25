import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/stats — platform-wide stats for the admin dashboard
export async function GET() {
  const [
    totalSellers,
    totalOrders,
    totalCustomers,
    totalStaff,
    openTickets,
    totalFormViews,
    sellers,
  ] = await Promise.all([
    db.seller.count(),
    db.order.count(),
    db.customer.count(),
    db.staff.count({ where: { active: true } }),
    db.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    db.formView.count(),
    db.seller.findMany({
      select: { id: true, plan: true, createdAt: true },
    }),
  ]);

  // Plan distribution
  const planDistribution: Record<string, number> = {};
  for (const s of sellers) {
    planDistribution[s.plan] = (planDistribution[s.plan] || 0) + 1;
  }

  // Total revenue across all sellers
  const revenueAgg = await db.order.aggregate({
    where: { paymentStatus: { in: ["Paid", "Partial"] } },
    _sum: { total: true },
  });

  // Sellers joined this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newThisMonth = sellers.filter((s) => s.createdAt >= startOfMonth).length;

  return NextResponse.json({
    totalSellers,
    totalOrders,
    totalCustomers,
    totalStaff,
    openTickets,
    totalFormViews,
    totalRevenue: revenueAgg._sum.total || 0,
    planDistribution,
    newThisMonth,
  });
}
