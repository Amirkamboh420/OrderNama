import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// POST /api/orders/bulk { ids: string[], status?: string, paymentStatus?: string }
export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ error: "No ids provided" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Verify all orders belong to seller
  const owned = await db.order.findMany({
    where: { id: { in: ids }, sellerId: seller.id },
    select: { id: true, status: true, customerId: true, orderNumber: true },
  });
  const ownedIds = owned.map((o) => o.id);

  if (ownedIds.length === 0) {
    return NextResponse.json({ error: "No matching orders" }, { status: 404 });
  }

  // Update many
  const result = await db.order.updateMany({
    where: { id: { in: ownedIds } },
    data,
  });

  // Log WhatsApp messages for status changes if autoStatusUpdate enabled
  if (body.status) {
    const setting = await db.setting.findUnique({ where: { sellerId: seller.id } });
    if (setting?.autoStatusUpdate) {
      const changed = owned.filter((o) => o.status !== body.status);
      for (const o of changed) {
        const cust = await db.customer.findUnique({ where: { id: o.customerId } });
        if (cust) {
          await db.whatsAppLog.create({
            data: {
              sellerId: seller.id,
              orderId: o.id,
              toPhone: cust.phone,
              message: `*${seller.businessName}* — Aapka order ${o.orderNumber} ka naya status: *${body.status}*. Shukriya! 🌿`,
              status: "sent",
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ updated: result.count, requested: ids.length });
}
