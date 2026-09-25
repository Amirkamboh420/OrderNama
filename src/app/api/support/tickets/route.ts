import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/support/tickets — list tickets for the current seller
// POST — create a new support ticket
export async function GET(req: NextRequest) {
  const seller = await requireSeller();
  const url = req.nextUrl;
  const status = url.searchParams.get("status") || "";

  const where: Record<string, unknown> = { sellerId: seller.id };
  if (status && status !== "all") where.status = status;

  const tickets = await db.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const data = tickets.map((t) => ({
    ...t,
    responses: JSON.parse(t.responses || "[]"),
  }));

  return NextResponse.json({ tickets: data, count: data.length });
}

export async function POST(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();

  const ticket = await db.supportTicket.create({
    data: {
      sellerId: seller.id,
      subject: body.subject,
      message: body.message,
      category: body.category || "general",
      priority: body.priority || "normal",
      status: "open",
      responses: JSON.stringify([
        { from: "seller", message: body.message, at: new Date().toISOString() },
      ]),
    },
  });

  return NextResponse.json({ id: ticket.id, ok: true });
}
