import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/public/submit-order — public endpoint for customers to submit orders
// Body: { slug, customerName, customerPhone, customerCity, customerAddress, items: [{name, sku?, qty, price}], notes? }
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Find seller by their order form slug
  const setting = await db.setting.findFirst({
    where: { orderFormSlug: body.slug },
    include: { seller: true },
  });

  if (!setting || !setting.seller) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const seller = setting.seller;

  // Find or create customer by phone
  let customer = await db.customer.findFirst({
    where: { sellerId: seller.id, phone: body.customerPhone },
  });

  if (!customer) {
    customer = await db.customer.create({
      data: {
        sellerId: seller.id,
        name: body.customerName,
        phone: body.customerPhone,
        address: body.customerAddress || null,
        city: body.customerCity || null,
        tags: "New",
      },
    });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = items.reduce((s: number, it: { qty: number; price: number }) => s + it.qty * it.price, 0);
  const shipping = 200;
  const total = subtotal + shipping;
  const orderCount = await db.order.count({ where: { sellerId: seller.id } });
  const orderNumber = `ORD-${1000 + orderCount + 1}`;

  const order = await db.order.create({
    data: {
      sellerId: seller.id,
      customerId: customer.id,
      orderNumber,
      itemsJson: JSON.stringify(items),
      subtotal,
      shipping,
      discount: 0,
      total,
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentMethod: "COD",
      source: "Form",
      notes: body.notes || "Customer-submitted via order form",
    },
  });

  // Auto WhatsApp confirmation
  if (setting.autoConfirm) {
    await db.whatsAppLog.create({
      data: {
        sellerId: seller.id,
        orderId: order.id,
        toPhone: customer.phone,
        message: `*${seller.businessName}* — Aapka order ${orderNumber} receive ho gaya hai! Total: Rs ${total}. Ham jald confirm karenge. Shukriya! 🌿`,
        status: "sent",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    orderNumber,
    total,
    businessName: seller.businessName,
  });
}
