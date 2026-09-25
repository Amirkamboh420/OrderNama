import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

export async function GET() {
  const seller = await requireSeller();
  // Notifications = recent low-stock items + pending orders + unpaid orders, recent whatsapp fails
  const lowStock = await db.inventoryItem.findMany({
    where: { sellerId: seller.id },
    orderBy: { stock: "asc" },
    take: 30,
  });
  const lowStockItems = lowStock.filter((i) => i.stock <= i.lowStockAt);

  const pendingOrders = await db.order.count({
    where: { sellerId: seller.id, status: "Pending" },
  });

  const unpaidOrders = await db.order.findMany({
    where: { sellerId: seller.id, paymentStatus: "Unpaid", status: { not: "Cancelled" } },
    take: 5,
    include: { customer: true },
  });

  const recentLogs = await db.whatsAppLog.findMany({
    where: { sellerId: seller.id, status: "failed" },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    lowStock: lowStockItems.map((i) => ({ id: i.id, name: i.name, sku: i.sku, stock: i.stock, lowStockAt: i.lowStockAt })),
    pendingOrders,
    unpaidOrders: unpaidOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      customer: o.customer.name,
    })),
    failedWhatsapps: recentLogs.length,
  });
}
