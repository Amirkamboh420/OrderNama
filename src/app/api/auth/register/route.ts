import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachSessionCookie, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is invalid" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Name 2 se 100 characters ka hona chahiye." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Valid email address enter karein." }, { status: 400 });
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Password kam az kam 8 characters ka hona chahiye." }, { status: 400 });

  const existing = await db.userAccount.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Is email se account pehle se maujood hai. Login karein." }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "store";
  const account = await db.$transaction(async (tx) => {
    const seller = await tx.seller.create({
      data: {
        businessName: `${name}'s Store`,
        ownerName: name,
        phone: "",
        email,
        plan: "Free",
        currency: "PKR",
        romanUrdu: true,
      },
    });
    await tx.setting.create({
      data: {
        sellerId: seller.id,
        orderFormSlug: `${slugBase}-${seller.id.slice(-6).toLowerCase()}`,
        autoConfirm: true,
        autoStatusUpdate: true,
        lowStockAlert: true,
      },
    });
    return tx.userAccount.create({
      data: { name, email, passwordHash, role: "owner", sellerId: seller.id },
      select: { id: true, name: true, email: true, role: true, sellerId: true },
    });
  });

  return attachSessionCookie(NextResponse.json({ ok: true, user: { id: account.id, name: account.name, email: account.email, role: account.role } }, { status: 201 }), account);
}
