import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const customer = await db.customer.findFirst({ where: { id, sellerId: seller.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orders = await db.order.findMany({
    where: { customerId: id, sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,
      itemsJson: true,
    },
  });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    city: customer.city,
    address: customer.address,
    instagram: customer.instagram,
    notes: customer.notes,
    tags: customer.tags || "",
    isRepeat: customer.isRepeat,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    createdAt: customer.createdAt,
    orders: orders.map((o) => ({
      ...o,
      items: JSON.parse(o.itemsJson),
      itemsJson: undefined,
    })),
  });
}

// PATCH — update customer fields (currently used for tags + notes)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const body = await req.json();

  const customer = await db.customer.findFirst({ where: { id, sellerId: seller.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.birthday !== undefined) data.birthday = body.birthday || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.city !== undefined) data.city = body.city || null;
  if (body.address !== undefined) data.address = body.address || null;
  if (body.instagram !== undefined) data.instagram = body.instagram || null;
  if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

  await db.customer.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const customer = await db.customer.findFirst({ where: { id, sellerId: seller.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
