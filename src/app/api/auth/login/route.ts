import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is invalid" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Email aur password dono required hain." }, { status: 400 });

  const account = await db.userAccount.findUnique({ where: { email } });
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return NextResponse.json({ error: "Email ya password ghalat hai." }, { status: 401 });
  }

  return attachSessionCookie(
    NextResponse.json({ ok: true, user: { id: account.id, name: account.name, email: account.email, role: account.role } }),
    account,
    body.remember !== false,
  );
}
