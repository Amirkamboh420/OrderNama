import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/staff — list staff members for the current seller
export async function GET() {
  const seller = await requireSeller();
  const staff = await db.staff.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ staff, count: staff.length });
}

// POST — add a new staff member
export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();

  const existing = await db.staff.findFirst({
    where: { sellerId: seller.id, phone: body.phone },
  });
  if (existing) return NextResponse.json({ id: existing.id }, { status: 200 });

  const s = await db.staff.create({
    data: {
      sellerId: seller.id,
      name: body.name,
      phone: body.phone,
      role: body.role || "staff",
      permissions: body.permissions || "orders,customers,inventory",
      active: true,
    },
  });
  return NextResponse.json({ id: s.id, ok: true });
}
