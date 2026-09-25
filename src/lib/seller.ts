import { db } from "@/lib/db";

/**
 * Returns the active demo seller (the first seller created).
 * In a real multi-tenant app this would resolve from auth session.
 */
export async function getDemoSeller() {
  let seller = await db.seller.findFirst({ orderBy: { createdAt: "asc" } });

  if (!seller) {
    seller = await db.seller.create({
      data: {
        businessName: "Gulbahar Boutique",
        ownerName: "Hira Parveen",
        phone: "+923001111222",
        whatsappNumber: "+923001111222",
        email: "hira@gulbahar.pk",
        city: "Karachi",
        plan: "Pro",
        currency: "PKR",
        romanUrdu: true,
      },
    });

    await db.setting.create({
      data: {
        sellerId: seller.id,
        autoConfirm: true,
        autoStatusUpdate: true,
        lowStockAlert: true,
        orderFormSlug: "gulbahar-boutique",
        brandColor: "#1E8C45",
        monthlyGoal: 100000,
      },
    });
  }

  return seller;
}

export async function requireSeller() {
  const seller = await getDemoSeller();
  if (!seller) throw new Error("No seller found. Please seed the database.");
  return seller;
}

export const STATUS_FLOW = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;
export const PAY_STATUSES = ["Paid", "Unpaid", "Partial"] as const;
export const PAY_METHODS = ["COD", "JazzCash", "EasyPaisa", "Bank", "Other"] as const;

export function formatPKR(n: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
}
