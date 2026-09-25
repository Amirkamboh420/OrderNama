import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// POST /api/inventory/import
// Accepts a CSV text body with headers: name,sku,category,stock,lowStockAt,price
// Creates/updates inventory items. Matches by SKU (if present) or name.
export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();
  const csv: string = body.csv || "";
  if (!csv.trim()) {
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
  }

  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV needs a header + at least 1 row" }, { status: 400 });
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const skuIdx = headers.indexOf("sku");
  const catIdx = headers.indexOf("category");
  const stockIdx = headers.indexOf("stock");
  const lowIdx = headers.indexOf("lowstockat") !== -1 ? headers.indexOf("lowstockat") : headers.indexOf("low_stock_at");
  const priceIdx = headers.indexOf("price");

  if (nameIdx === -1) {
    return NextResponse.json({ error: "CSV must have a 'name' column" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const cols = row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[nameIdx];
    if (!name) {
      skipped++;
      continue;
    }
    const sku = skuIdx !== -1 ? cols[skuIdx] || null : null;
    const category = catIdx !== -1 ? cols[catIdx] || null : null;
    const stock = stockIdx !== -1 ? parseInt(cols[stockIdx], 10) || 0 : 0;
    const lowStockAt = lowIdx !== -1 ? parseInt(cols[lowIdx], 10) || 5 : 5;
    const price = priceIdx !== -1 ? parseFloat(cols[priceIdx]) || 0 : 0;

    try {
      // Match by SKU (if present) or name
      const existing = sku
        ? await db.inventoryItem.findFirst({ where: { sellerId: seller.id, sku } })
        : await db.inventoryItem.findFirst({ where: { sellerId: seller.id, name } });

      if (existing) {
        await db.inventoryItem.update({
          where: { id: existing.id },
          data: { name, sku, category, stock, lowStockAt, price },
        });
        updated++;
      } else {
        await db.inventoryItem.create({
          data: { sellerId: seller.id, name, sku, category, stock, lowStockAt, price },
        });
        created++;
      }
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    skipped,
    errors: errors.slice(0, 10),
    total: created + updated,
  });
}
