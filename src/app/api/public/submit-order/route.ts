import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const customerCity = typeof body.customerCity === "string" ? body.customerCity.trim() : "";
  const customerAddress = typeof body.customerAddress === "string" ? body.customerAddress.trim() : "";
  const submittedItems = Array.isArray(body.items) ? body.items : [];

  if (!slug || !customerName || !customerPhone || submittedItems.length === 0) {
    return NextResponse.json({ error: "Name, phone, store and at least one item are required" }, { status: 400 });
  }
  if (customerName.length > 120 || customerPhone.length > 32 || customerCity.length > 100 || customerAddress.length > 500) {
    return NextResponse.json({ error: "One or more fields are too long" }, { status: 400 });
  }

  const setting = await db.setting.findFirst({
    where: { orderFormSlug: slug },
    include: { seller: true },
  });
  if (!setting?.seller) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  const seller = setting.seller;

  const productIds = submittedItems.map((item) =>
    typeof item === "object" && item !== null ? (item as { productId?: unknown }).productId : null,
  );
  if (productIds.some((id) => typeof id !== "string") || new Set(productIds).size !== productIds.length) {
    return NextResponse.json({ error: "Order contains invalid or duplicate products" }, { status: 400 });
  }

  const inventory = await db.inventoryItem.findMany({
    where: { sellerId: seller.id, id: { in: productIds as string[] } },
  });
  if (inventory.length !== submittedItems.length) {
    return NextResponse.json({ error: "One or more products are no longer available" }, { status: 409 });
  }

  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const items = submittedItems.map((submitted) => {
    const line = submitted as { productId: string; qty: unknown };
    const product = inventoryById.get(line.productId);
    if (!product || !Number.isInteger(line.qty) || Number(line.qty) < 1 || Number(line.qty) > product.stock) return null;
    return { productId: product.id, name: product.name, sku: product.sku, qty: Number(line.qty), price: product.price };
  });
  if (items.some((item) => item === null)) {
    return NextResponse.json({ error: "Requested quantity is invalid or exceeds current stock" }, { status: 409 });
  }

  const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
  const subtotal = validItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const shipping = 200;
  const total = subtotal + shipping;

  const result = await db.$transaction(async (tx) => {
    for (const item of validItems) {
      const updated = await tx.inventoryItem.updateMany({
        where: { id: item.productId, sellerId: seller.id, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (updated.count !== 1) throw new Error("STOCK_CHANGED");
    }

    const previousCustomer = await tx.customer.findFirst({ where: { sellerId: seller.id, phone: customerPhone } });
    const customer = previousCustomer || await tx.customer.create({
      data: {
        sellerId: seller.id,
        name: customerName,
        phone: customerPhone,
        address: customerAddress || null,
        city: customerCity || null,
        tags: "New",
      },
    });
    const orderCount = await tx.order.count({ where: { sellerId: seller.id } });
    const orderNumber = `ORD-${1000 + orderCount + 1}`;
    const order = await tx.order.create({
      data: {
        sellerId: seller.id,
        customerId: customer.id,
        orderNumber,
        itemsJson: JSON.stringify(validItems.map(({ productId: _productId, ...item }) => item)),
        subtotal,
        shipping,
        discount: 0,
        total,
        status: "Pending",
        paymentStatus: "Unpaid",
        paymentMethod: "COD",
        source: "Form",
        notes: "Customer-submitted via order form",
      },
    });
    return { customer, order };
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "STOCK_CHANGED") return null;
    throw error;
  });

  if (!result) return NextResponse.json({ error: "Stock changed while placing the order. Please review your cart." }, { status: 409 });

  if (setting.autoConfirm) {
    await db.whatsAppLog.create({
      data: {
        sellerId: seller.id,
        orderId: result.order.id,
        toPhone: result.customer.phone,
        message: `*${seller.businessName}* — Aapka order ${result.order.orderNumber} receive ho gaya hai! Total: Rs ${total}. Ham jald confirm karenge. Shukriya! 🌿`,
        status: "sent",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    orderNumber: result.order.orderNumber,
    total,
    businessName: seller.businessName,
  });
}
