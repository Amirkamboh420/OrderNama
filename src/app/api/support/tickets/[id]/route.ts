import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/support/tickets/[id] — get a single ticket
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const ticket = await db.supportTicket.findFirst({
    where: { id, sellerId: seller.id },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...ticket, responses: JSON.parse(ticket.responses || "[]") });
}

// PATCH — update ticket status / add a response
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;
  const body = await req.json();

  const ticket = await db.supportTicket.findFirst({ where: { id, sellerId: seller.id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.priority) updates.priority = body.priority;

  if (body.response) {
    const responses = JSON.parse(ticket.responses || "[]") as {
      from: string;
      message: string;
      at: string;
    }[];
    responses.push({
      from: body.from || "seller",
      message: body.response,
      at: new Date().toISOString(),
    });
    updates.responses = JSON.stringify(responses);
    // If seller responds, move to in_progress
    if ((body.from || "seller") === "seller" && ticket.status === "open") {
      updates.status = "in_progress";
    }
  }

  await db.supportTicket.update({ where: { id }, data: updates });
  return NextResponse.json({ ok: true });
}
