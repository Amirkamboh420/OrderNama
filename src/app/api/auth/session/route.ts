import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ authenticated: false, user: null });
  return NextResponse.json({
    authenticated: true,
    user: { id: session.userId, name: session.name, email: session.email, role: session.role },
  });
}
