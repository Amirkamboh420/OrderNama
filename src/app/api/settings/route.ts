import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET() {
  const seller = await requireSeller();
  const setting = await db.setting.findUnique({ where: { sellerId: seller.id } });
  return NextResponse.json({
    seller: {
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
    },
    setting: setting
      ? {
          autoConfirm: setting.autoConfirm,
          autoStatusUpdate: setting.autoStatusUpdate,
          lowStockAlert: setting.lowStockAlert,
          orderFormSlug: setting.orderFormSlug,
          brandColor: setting.brandColor,
          monthlyGoal: setting.monthlyGoal,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest) {
  const seller = await requireSeller();
  const body = await req.json();

  // Update seller fields
  const sellerData: Record<string, unknown> = {};
  if (body.businessName !== undefined) sellerData.businessName = body.businessName;
  if (body.ownerName !== undefined) sellerData.ownerName = body.ownerName;
  if (body.whatsappNumber !== undefined) sellerData.whatsappNumber = body.whatsappNumber;
  if (body.email !== undefined) sellerData.email = body.email;
  if (body.city !== undefined) sellerData.city = body.city;
  if (body.plan !== undefined) sellerData.plan = body.plan;
  if (body.romanUrdu !== undefined) sellerData.romanUrdu = body.romanUrdu;
  if (Object.keys(sellerData).length) {
    await db.seller.update({ where: { id: seller.id }, data: sellerData });
  }

  // Update setting fields
  const settingData: Record<string, unknown> = {};
  if (body.autoConfirm !== undefined) settingData.autoConfirm = body.autoConfirm;
  if (body.autoStatusUpdate !== undefined) settingData.autoStatusUpdate = body.autoStatusUpdate;
  if (body.lowStockAlert !== undefined) settingData.lowStockAlert = body.lowStockAlert;
  if (body.orderFormSlug !== undefined) settingData.orderFormSlug = body.orderFormSlug;
  if (body.brandColor !== undefined) settingData.brandColor = body.brandColor;
  if (body.monthlyGoal !== undefined) settingData.monthlyGoal = Number(body.monthlyGoal);

  if (Object.keys(settingData).length) {
    const existing = await db.setting.findUnique({ where: { sellerId: seller.id } });
    if (existing) {
      await db.setting.update({ where: { sellerId: seller.id }, data: settingData });
    } else {
      await db.setting.create({ data: { sellerId: seller.id, ...settingData } as never });
    }
  }

  return NextResponse.json({ ok: true });
}
