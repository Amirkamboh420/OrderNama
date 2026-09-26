import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const setting = await db.setting.findFirst({
    where: { orderFormSlug: slug },
    include: { seller: true },
  });

  if (!setting?.seller) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const items = await db.inventoryItem.findMany({
    where: { sellerId: setting.sellerId, stock: { gt: 0 } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, category: true, stock: true, lowStockAt: true, price: true },
  });

  return NextResponse.json({
    seller: { id: setting.seller.id, businessName: setting.seller.businessName },
    setting: { orderFormSlug: setting.orderFormSlug, brandColor: setting.brandColor },
    items,
  });
}
