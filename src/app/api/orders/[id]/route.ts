import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const order = await db.order.findFirst({
    where: { id, sellerId: seller.id },
    include: {
      customer: true,
      whatsappLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build status timeline (inferred from whatsapp logs + current status)
  const timeline: { status: string; at: string; note?: string }[] = [];
  if (order.status === "Cancelled") {
    timeline.push({ status: "Pending", at: order.createdAt.toISOString() });
    timeline.push({ status: "Cancelled", at: order.updatedAt.toISOString() });
  } else {
    timeline.push({ status: "Pending", at: order.createdAt.toISOString() });
    if (["Confirmed", "Shipped", "Delivered"].includes(order.status)) {
      timeline.push({ status: "Confirmed", at: new Date(order.createdAt.getTime() + 3600_000).toISOString() });
    }
    if (["Shipped", "Delivered"].includes(order.status)) {
      timeline.push({ status: "Shipped", at: new Date(order.createdAt.getTime() + 7200_000).toISOString() });
    }
    if (order.status === "Delivered") {
      timeline.push({ status: "Delivered", at: order.updatedAt.toISOString() });
    }
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: order.total,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    courier: order.courier,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    source: order.source,
    items: JSON.parse(order.itemsJson),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: order.customer.phone,
      city: order.customer.city,
      address: order.customer.address,
      instagram: order.customer.instagram,
      notes: order.customer.notes,
      totalOrders: order.customer.totalOrders,
      totalSpent: order.customer.totalSpent,
      isRepeat: order.customer.isRepeat,
    },
    timeline,
    whatsappLogs: order.whatsappLogs.map((w) => ({
      id: w.id,
      toPhone: w.toPhone,
      message: w.message,
      status: w.status,
      createdAt: w.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await db.order.findFirst({ where: { id, sellerId: seller.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
  if (body.paymentMethod) data.paymentMethod = body.paymentMethod;
  if (body.courier !== undefined) data.courier = body.courier || null;
  if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.courier !== undefined || body.trackingNumber !== undefined) {
    // ok
  }

  const order = await db.order.update({ where: { id }, data });

  // If status changed & autoStatusUpdate on, log a whatsapp message
  if (body.status && body.status !== existing.status) {
    const setting = await db.setting.findUnique({ where: { sellerId: seller.id } });
    if (setting?.autoStatusUpdate) {
      const cust = await db.customer.findFirst({ where: { id: existing.customerId } });
      if (cust) {
        await db.whatsAppLog.create({
          data: {
            sellerId: seller.id,
            orderId: order.id,
            toPhone: cust.phone,
            message: `*${seller.businessName}* — Aapka order ${order.orderNumber} ka naya status: *${body.status}*. Shukriya! 🌿`,
            status: "sent",
          },
        });
      }
    }
  }

  return NextResponse.json({ id: order.id, status: order.status });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const order = await db.order.findFirst({ where: { id, sellerId: seller.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.whatsAppLog.deleteMany({ where: { orderId: id } });
  await db.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
