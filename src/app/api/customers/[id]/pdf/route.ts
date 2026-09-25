import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/seller";

// GET /api/customers/[id]/pdf — returns a printable customer order history report
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const seller = await requireSeller();
  const { id } = await ctx.params;

  const customer = await db.customer.findFirst({
    where: { id, sellerId: seller.id },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orders = await db.order.findMany({
    where: { customerId: id, sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      total: true,
      createdAt: true,
      itemsJson: true,
    },
  });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  const totalSpent = customer.totalSpent;
  const totalOrders = customer.totalOrders;

  const orderRows = orders
    .map((o) => {
      const items = JSON.parse(o.itemsJson) as { name: string; qty: number }[];
      const itemsSummary = items.map((i) => `${i.qty}× ${i.name}`).join(", ");
      const statusClass = `status-${o.status.toLowerCase()}`;
      const payClass = `pay-${o.paymentStatus.toLowerCase()}`;
      return `
        <tr>
          <td>${o.orderNumber}</td>
          <td>${formatDate(o.createdAt)}</td>
          <td>${itemsSummary}</td>
          <td><span class="badge ${statusClass}">${o.status}</span></td>
          <td><span class="badge ${payClass}">${o.paymentStatus}</span></td>
          <td class="num">Rs ${o.total.toLocaleString("en-PK")}</td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Customer History — ${customer.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #f5f5f5; padding: 24px; }
  .report { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #007542, #1E8C45, #58BB43); color: #fff; padding: 28px 32px; }
  .header h1 { font-size: 22px; font-weight: 800; }
  .header .subtitle { font-size: 12px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .summary { display: flex; gap: 16px; padding: 24px 32px; border-bottom: 1px solid #eee; }
  .stat { flex: 1; text-align: center; }
  .stat .value { font-size: 28px; font-weight: 800; color: #1E8C45; }
  .stat .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-top: 4px; }
  .cust-info { padding: 20px 32px; border-bottom: 1px solid #eee; font-size: 13px; line-height: 1.7; }
  .cust-info strong { color: #1E8C45; }
  .orders { padding: 20px 32px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 8px 0; border-bottom: 2px solid #f0f0f0; }
  th.num { text-align: right; }
  td { font-size: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .status-delivered { background: #d1fae5; color: #065f46; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-shipped { background: #ede9fe; color: #5b21b6; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .status-confirmed { background: #dbeafe; color: #1e40af; }
  .pay-paid { background: #d1fae5; color: #065f46; }
  .pay-unpaid { background: #fee2e2; color: #991b1b; }
  .pay-partial { background: #fef3c7; color: #92400e; }
  .footer { background: #f9f9f9; padding: 20px 32px; text-align: center; }
  .footer p { font-size: 12px; color: #666; }
  .footer .brand { font-weight: 700; color: #1E8C45; }
  @media print { body { background: #fff; padding: 0; } .report { box-shadow: none; } }
</style>
</head>
<body>
<div class="report">
  <div class="header">
    <h1>Customer Order History</h1>
    <div class="subtitle">${seller.businessName}</div>
  </div>
  <div class="summary">
    <div class="stat">
      <div class="value">${totalOrders}</div>
      <div class="label">Total Orders</div>
    </div>
    <div class="stat">
      <div class="value">Rs ${totalSpent.toLocaleString("en-PK")}</div>
      <div class="label">Total Spent</div>
    </div>
    <div class="stat">
      <div class="value">${orders.length}</div>
      <div class="label">Records</div>
    </div>
  </div>
  <div class="cust-info">
    <strong>${customer.name}</strong>${customer.isRepeat ? ' · <span style="color:#92400e">⭐ Repeat Customer</span>' : ""}<br>
    Phone: ${customer.phone}${customer.city ? `<br>City: ${customer.city}` : ""}${customer.address ? `<br>Address: ${customer.address}` : ""}${customer.instagram ? `<br>Instagram: ${customer.instagram}` : ""}${customer.notes ? `<br><em>${customer.notes}</em>` : ""}
  </div>
  <div class="orders">
    <table>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Date</th>
          <th>Items</th>
          <th>Status</th>
          <th>Payment</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderRows || '<tr><td colspan="6" style="text-align:center;color:#999">No orders found</td></tr>'}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <p>Generated on ${formatDate(new Date())} by <span class="brand">${seller.businessName}</span></p>
    <p style="margin-top:4px;font-size:10px;color:#aaa">Powered by OrderNama</p>
  </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
