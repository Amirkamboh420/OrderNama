import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// POST /api/whatsapp/send  { orderId, message } | { toPhone, message }
export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();

  let toPhone = body.toPhone as string | undefined;
  let orderId: string | null = body.orderId || null;
  const message = (body.message as string) || `*${seller.businessName}* — reminder message 🌿`;

  if (orderId) {
    const order = await db.order.findFirst({
      where: { id: orderId, sellerId: seller.id },
      include: { customer: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    toPhone = toPhone || order.customer.phone;
  }
  if (!toPhone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

  const log = await db.whatsAppLog.create({
    data: {
      sellerId: seller.id,
      orderId,
      toPhone,
      message,
      status: "sent",
    },
  });

  return NextResponse.json({ id: log.id, status: "sent", toPhone });
}

// GET — list recent logs
export async function GET() {
  const seller = await requireSeller();
  const logs = await db.whatsAppLog.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { order: { select: { orderNumber: true } } },
  });
  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      toPhone: l.toPhone,
      message: l.message,
      status: l.status,
      createdAt: l.createdAt,
      orderNumber: l.order?.orderNumber,
    })),
  });
}
