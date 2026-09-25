import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const item = await db.inventoryItem.findFirst({ where: { id, sellerId: seller.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const body = await req.json();
  const item = await db.inventoryItem.findFirst({ where: { id, sellerId: seller.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.sku !== undefined) data.sku = body.sku;
  if (body.category !== undefined) data.category = body.category;
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.lowStockAt !== undefined) data.lowStockAt = Number(body.lowStockAt);
  if (body.price !== undefined) data.price = Number(body.price);
  await db.inventoryItem.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
