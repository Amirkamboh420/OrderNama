import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/orders/[id]/invoice — returns full invoice data for printable receipt
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;

  const order = await db.order.findFirst({
    where: { id, sellerId: seller.id },
    include: { customer: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = JSON.parse(order.itemsJson) as {
    name: string;
    sku?: string;
    qty: number;
    price: number;
  }[];

  return NextResponse.json({
    invoice: {
      number: order.orderNumber,
      date: order.createdAt,
      dueDate: order.status === "Delivered" ? order.updatedAt : null,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    },
    seller: {
      businessName: seller.businessName,
      ownerName: seller.ownerName,
      phone: seller.phone,
      whatsappNumber: seller.whatsappNumber,
      email: seller.email,
      city: seller.city,
    },
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
    },
    items: items.map((it) => ({
      name: it.name,
      sku: it.sku || "",
      qty: it.qty,
      price: it.price,
      total: it.qty * it.price,
    })),
    totals: {
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
    },
    courier: order.courier,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
  });
}
