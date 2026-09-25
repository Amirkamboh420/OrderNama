import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// POST /api/orders/auto-advance
// Auto-advances order statuses based on age:
//   Pending → Confirmed (if > 1 day old)
//   Confirmed → Shipped (if > 2 days old)
//   Shipped → Delivered (if > 5 days old)
// Returns { advanced: N, details: [...] }
export async function POST() {
  const seller = await requireSeller();
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  const orders = await db.order.findMany({
    where: {
      sellerId: seller.id,
      status: { in: ["Pending", "Confirmed", "Shipped"] },
    },
    select: { id: true, orderNumber: true, status: true, createdAt: true, updatedAt: true },
  });

  const advanced: { id: string; orderNumber: string; from: string; to: string }[] = [];

  for (const o of orders) {
    const age = now.getTime() - o.createdAt.getTime();
    const sinceUpdate = now.getTime() - o.updatedAt.getTime();
    let newStatus: string | null = null;

    if (o.status === "Pending" && age > 1 * DAY) {
      newStatus = "Confirmed";
    } else if (o.status === "Confirmed" && sinceUpdate > 2 * DAY) {
      newStatus = "Shipped";
    } else if (o.status === "Shipped" && sinceUpdate > 5 * DAY) {
      newStatus = "Delivered";
    }

    if (newStatus) {
      await db.order.update({
        where: { id: o.id },
        data: { status: newStatus },
      });
      advanced.push({ id: o.id, orderNumber: o.orderNumber, from: o.status, to: newStatus });

      // Log WhatsApp message if auto-status-update is on
      const setting = await db.setting.findUnique({ where: { sellerId: seller.id } });
      if (setting?.autoStatusUpdate) {
        const order = await db.order.findUnique({
          where: { id: o.id },
          include: { customer: true },
        });
        if (order?.customer) {
          await db.whatsAppLog.create({
            data: {
              sellerId: seller.id,
              orderId: o.id,
              toPhone: order.customer.phone,
              message: `*${seller.businessName}* — Aapka order ${o.orderNumber} ka naya status: *${newStatus}*. Shukriya! 🌿`,
              status: "sent",
            },
          });
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    advanced: advanced.length,
    details: advanced,
  });
}
