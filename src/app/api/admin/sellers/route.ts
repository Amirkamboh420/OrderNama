import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/sellers — list all sellers with stats (admin only)
export async function GET() {
  const sellers = await db.seller.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true, customers: true, inventory: true },
      },
    },
  });

  const data = await Promise.all(
    sellers.map(async (s) => {
      const orderCount = await db.order.count({ where: { sellerId: s.id } });
      const revenue = await db.order.aggregate({
        where: { sellerId: s.id, paymentStatus: { in: ["Paid", "Partial"] } },
        _sum: { total: true },
      });
      const staffCount = await db.staff.count({ where: { sellerId: s.id, active: true } });
      const ticketCount = await db.supportTicket.count({
        where: { sellerId: s.id, status: { in: ["open", "in_progress"] } },
      });
      return {
        id: s.id,
        businessName: s.businessName,
        ownerName: s.ownerName,
        phone: s.phone,
        city: s.city,
        plan: s.plan,
        email: s.email,
        createdAt: s.createdAt,
        orderCount,
        customerCount: s._count.customers,
        inventoryCount: s._count.inventory,
        revenue: revenue._sum.total || 0,
        staffCount,
        ticketCount,
      };
    })
  );

  return NextResponse.json({ sellers: data, count: data.length });
}
