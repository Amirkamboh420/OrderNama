import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// PATCH /api/staff/[id] — update staff member (toggle active, change permissions)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const body = await req.json();

  const member = await db.staff.findFirst({ where: { id, sellerId: seller.id } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
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
