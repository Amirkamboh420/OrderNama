import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";
import { hashPassword } from "@/lib/auth";

// PATCH /api/staff/[id] — update staff member (toggle active, change permissions)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const body = await req.json();

  const member = await db.staff.findFirst({ where: { id, sellerId: seller.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.email !== undefined && !member.passwordHash && (typeof body.password !== "string" || body.password.length < 8)) {
    return NextResponse.json({ error: "Set a password of at least 8 characters to enable this staff login." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.email !== undefined) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    const [account, otherStaff] = await Promise.all([
      db.userAccount.findUnique({ where: { email } }),
      db.staff.findFirst({ where: { email } }),
    ]);
    if (account || (otherStaff && otherStaff.id !== id)) return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    data.email = email;
  }
  if (body.password !== undefined && body.password !== "") {
    if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128) return NextResponse.json({ error: "Password must be 8–128 characters." }, { status: 400 });
    data.passwordHash = await hashPassword(body.password);
  }
  if (body.role !== undefined) data.role = body.role;
  if (body.permissions !== undefined) data.permissions = body.permissions;
  if (body.active !== undefined) data.active = body.active;

  await db.staff.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a staff member
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const member = await db.staff.findFirst({ where: { id, sellerId: seller.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.staff.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
