import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/activity — unified recent activity feed (whatsapp logs + recent orders + status changes)
export async function GET() {
  const seller = await requireSeller();

  const [whatsappLogs, recentOrders] = await Promise.all([
    db.whatsAppLog.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { order: { select: { orderNumber: true } } },
    }),
    db.order.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { name: true, phone: true } },
      },
    }),
  ]);

  type Activity = {
    id: string;
    kind: "whatsapp" | "order_created" | "order_updated";
    title: string;
    detail: string;
    at: Date;
    tone: "brand" | "emerald" | "amber" | "blue" | "purple" | "rose";
  };

  const activities: Activity[] = [];

  for (const w of whatsappLogs) {
    activities.push({
      id: `wa-${w.id}`,
      kind: "whatsapp",
      title: `WhatsApp sent to ${w.toPhone}`,
      detail: w.order?.orderNumber ? `Order ${w.order.orderNumber}` : "Direct message",
      at: w.createdAt,
      tone: "brand",
    });
  }

  for (const o of recentOrders) {
    activities.push({
      id: `oc-${o.id}`,
      kind: "order_created",
      title: `${o.customer.name} ne order diya`,
      detail: `${o.orderNumber} · ${o.status} · ${o.paymentStatus}`,
      at: o.createdAt,
      tone: o.status === "Delivered" ? "emerald" : o.status === "Cancelled" ? "rose" : o.status === "Shipped" ? "purple" : o.status === "Confirmed" ? "blue" : "amber",
    });
  }

  // Sort by date desc, take 15
  activities.sort((a, b) => b.at.getTime() - a.at.getTime());
  const top = activities.slice(0, 15);

  return NextResponse.json({
    activities: top.map((a) => ({
      ...a,
      at: a.at.toISOString(),
    })),
    counts: {
      whatsapp: whatsappLogs.length,
      orders: recentOrders.length,
    },
  });
}
