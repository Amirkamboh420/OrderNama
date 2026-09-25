import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET() {
  const seller = await requireSeller();
  return NextResponse.json({
    id: seller.id,
    businessName: seller.businessName,
    ownerName: seller.ownerName,
    phone: seller.phone,
    whatsappNumber: seller.whatsappNumber,
    email: seller.email,
    city: seller.city,
    plan: seller.plan,
    currency: seller.currency,
    romanUrdu: seller.romanUrdu,
    createdAt: seller.createdAt,
  });
}
