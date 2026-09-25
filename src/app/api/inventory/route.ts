import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const filter = url.searchParams.get("filter") || "";
  const q = url.searchParams.get("q") || "";

  const where: Record<string, unknown> = { sellerId: seller.id };
  if (q) where.name = { contains: q };
  if (filter === "low") {
    // SQLite doesn't support column-to-column compare; fetch all and filter in JS
    const all = await db.inventoryItem.findMany({ where: { sellerId: seller.id }, orderBy: { stock: "asc" } });
    const low = all.filter((i) => i.stock <= i.lowStockAt);
    return NextResponse.json({ items: low });
  }

  const items = await db.inventoryItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();
  const item = await db.inventoryItem.create({
    data: {
      sellerId: seller.id,
      name: body.name,
      sku: body.sku || null,
      category: body.category || null,
      stock: Number(body.stock) || 0,
      lowStockAt: Number(body.lowStockAt) || 5,
      price: Number(body.price) || 0,
    },
  });
  return NextResponse.json({ id: item.id });
}

export async function PUT(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();
  const { id, ...fields } = body;
  const item = await db.inventoryItem.findFirst({ where: { id, sellerId: seller.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (fields.name !== undefined) data.name = fields.name;
  if (fields.sku !== undefined) data.sku = fields.sku;
  if (fields.category !== undefined) data.category = fields.category;
  if (fields.stock !== undefined) data.stock = Number(fields.stock);
  if (fields.lowStockAt !== undefined) data.lowStockAt = Number(fields.lowStockAt);
  if (fields.price !== undefined) data.price = Number(fields.price);
  await db.inventoryItem.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
