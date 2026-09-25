import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const q = url.searchParams.get("q") || "";
  const tag = url.searchParams.get("tag") || "";
  const sort = url.searchParams.get("sort") || "recent";

  const where: Record<string, unknown> = { sellerId: seller.id };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { city: { contains: q } },
      { instagram: { contains: q } },
      { tags: { contains: q } },
    ];
  }
  if (tag) {
    where.tags = { contains: tag };
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "orders" ? { totalOrders: "desc" } :
    sort === "spent" ? { totalSpent: "desc" } :
    sort === "name" ? { name: "asc" } :
    { createdAt: "desc" };

  const customers = await db.customer.findMany({ where, orderBy, take: 200 });

  const data = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    city: c.city,
    address: c.address,
    instagram: c.instagram,
    notes: c.notes,
    tags: c.tags || "",
    birthday: c.birthday || null,
    isRepeat: c.isRepeat,
    totalOrders: c.totalOrders,
    totalSpent: c.totalSpent,
    createdAt: c.createdAt,
  }));

  // Compute unique tag list for filter chips
  const tagSet = new Set<string>();
  for (const c of customers) {
    if (c.tags) {
      for (const t of c.tags.split(",").map((x) => x.trim()).filter(Boolean)) {
        tagSet.add(t);
      }
    }
  }

  return NextResponse.json({ customers: data, count: data.length, tags: Array.from(tagSet) });
}

export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();

  const existing = await db.customer.findFirst({
    where: { sellerId: seller.id, phone: body.phone },
  });
  if (existing) return NextResponse.json({ id: existing.id, name: existing.name, phone: existing.phone }, { status: 200 });

  const c = await db.customer.create({
    data: {
      sellerId: seller.id,
      name: body.name,
      phone: body.phone,
      address: body.address || null,
      city: body.city || null,
      notes: body.notes || null,
      instagram: body.instagram || null,
      tags: body.tags || "",
      birthday: body.birthday || null,
    },
  });
  return NextResponse.json({ id: c.id, name: c.name, phone: c.phone });
}
