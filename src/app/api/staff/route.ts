import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";
import { hashPassword } from "@/lib/auth";

// GET /api/staff — list staff members for the current seller
export async function GET() {
  const seller = await requireSeller();
  const staff = await db.staff.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, phone: true, role: true, permissions: true, active: true, createdAt: true },
  });
  return NextResponse.json({ staff, count: staff.length });
}

// POST — add a new staff member
export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Valid name required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Password must be 8–128 characters." }, { status: 400 });

  const account = await db.userAccount.findUnique({ where: { email } });
  const existingStaffEmail = await db.staff.findFirst({ where: { email } });
  if (account || existingStaffEmail) return NextResponse.json({ error: "This email is already in use." }, { status: 409 });

  const existing = await db.staff.findFirst({
    where: { sellerId: seller.id, phone: body.phone },
  });
  if (existing) return NextResponse.json({ error: "A staff member with this phone already exists. Edit that member to set login credentials." }, { status: 409 });

  const s = await db.staff.create({
    data: {
      sellerId: seller.id,
      name,
      email,
      passwordHash: await hashPassword(password),
      phone: body.phone,
      role: body.role || "staff",
      permissions: body.permissions || "orders,customers,inventory",
      active: true,
    },
  });
  return NextResponse.json({ id: s.id, ok: true });
}
