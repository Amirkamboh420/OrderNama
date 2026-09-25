import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/orders/[id]/pdf — returns a simple printable HTML invoice
// (browser's print-to-PDF handles the actual PDF generation)
// This endpoint returns minimal HTML that opens in a new tab for printing.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;

  const order = await db.order.findFirst({
    where: { id, sellerId: seller.id },
    include: { customer: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = JSON.parse(order.itemsJson) as {
    name: string;
    sku?: string;
    qty: number;
    price: number;
  }[];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Invoice ${order.orderNumber} — ${seller.businessName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #f5f5f5; padding: 24px; }
  .invoice { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #007542, #1E8C45, #58BB43); color: #fff; padding: 28px 32px; }
  .header h1 { font-size: 22px; font-weight: 800; }
  .header .subtitle { font-size: 12px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .header .inv-num { font-size: 32px; font-weight: 800; margin-top: 12px; }
  .meta { display: flex; justify-content: space-between; padding: 20px 32px; border-bottom: 1px solid #eee; }
  .meta-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
  .meta-block p { font-size: 13px; line-height: 1.5; }
  .items { padding: 20px 32px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 8px 0; border-bottom: 2px solid #f0f0f0; }
  th.num { text-align: right; }
  td { font-size: 13px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { padding: 16px 32px 24px; display: flex; justify-content: flex-end; }
  .totals-inner { min-width: 200px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .totals-row.total { border-top: 2px solid #1E8C45; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 800; color: #1E8C45; }
  .footer { background: #f9f9f9; padding: 20px 32px; text-align: center; }
  .footer p { font-size: 12px; color: #666; line-height: 1.6; }
  .footer .brand { font-weight: 700; color: #1E8C45; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .status-delivered { background: #d1fae5; color: #065f46; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-shipped { background: #ede9fe; color: #5b21b6; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .status-confirmed { background: #dbeafe; color: #1e40af; }
  .pay-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  .pay-paid { background: #d1fae5; color: #065f46; }
  .pay-unpaid { background: #fee2e2; color: #991b1b; }
  .pay-partial { background: #fef3c7; color: #92400e; }
  .courier { padding: 12px 32px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  .notes { padding: 12px 32px; border-top: 1px solid #eee; font-size: 12px; color: #666; font-style: italic; }
  @media print { body { background: #fff; padding: 0; } .invoice { box-shadow: none; max-width: 100%; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <h1>${seller.businessName}</h1>
    <div class="subtitle">Order Receipt / Invoice</div>
    <div class="inv-num">${order.orderNumber}</div>
  </div>
  <div class="meta">
    <div class="meta-block">
      <h3>Invoice Details</h3>
      <p>Date: ${formatDate(order.createdAt)}</p>
      <p>Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span><span class="pay-badge pay-${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span></p>
      <p>Payment: ${order.paymentMethod}</p>
    </div>
    <div class="meta-block">
      <h3>Bill To</h3>
      <p>${order.customer.name}<br>${order.customer.phone}<br>${order.customer.address || ""}<br>${order.customer.city || ""}</p>
    </div>
  </div>
  <div class="items">
    <table>
      <thead>
        <tr>
          <th>Item / SKU</th>
          <th class="num">Qty</th>
          <th class="num">Price (PKR)</th>
          <th class="num">Total (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it) => `
          <tr>
            <td>${it.name}${it.sku ? `<br><span style="font-size:11px;color:#999">SKU: ${it.sku}</span>` : ""}</td>
            <td class="num">${it.qty}</td>
            <td class="num">Rs ${it.price.toLocaleString("en-PK")}</td>
            <td class="num">Rs ${(it.qty * it.price).toLocaleString("en-PK")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ${order.courier ? `<div class="courier">Dispatched via <strong>${order.courier}</strong>${order.trackingNumber ? ` · Tracking: ${order.trackingNumber}` : ""}</div>` : ""}
  ${order.notes ? `<div class="notes">Note: ${order.notes}</div>` : ""}
  <div class="totals">
    <div class="totals-inner">
      <div class="totals-row"><span>Subtotal</span><span>Rs ${order.subtotal.toLocaleString("en-PK")}</span></div>
      <div class="totals-row"><span>Shipping</span><span>Rs ${order.shipping.toLocaleString("en-PK")}</span></div>
      ${order.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>− Rs ${order.discount.toLocaleString("en-PK")}</span></div>` : ""}
      <div class="totals-row total"><span>TOTAL</span><span>Rs ${order.total.toLocaleString("en-PK")}</span></div>
    </div>
  </div>
  <div class="footer">
    <p>Shukriya aapke business ka hissa banne ke liye! 🌿</p>
    <p><span class="brand">${seller.businessName}</span> · ${seller.phone}${seller.whatsappNumber ? ` · WhatsApp: ${seller.whatsappNumber}` : ""}</p>
    <p style="margin-top:8px;font-size:10px;color:#aaa">Powered by OrderNama</p>
  </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
