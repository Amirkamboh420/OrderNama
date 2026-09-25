"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Store,
  Truck,
  Printer,
  MessageCircle,
  X,
  FileText,
  MapPin,
  Phone,
  Calendar,
  Download,
  ExternalLink,
} from "lucide-react";
import { api, formatPKR } from "@/lib/api";
import { StatusBadge, PayBadge } from "@/components/ordernama/badges";
import { cn } from "@/lib/utils";

type InvoiceButtonVariant = "default" | "outline" | "ghost" | "secondary";

/* ------------------------------------------------------------------ */
/* Types — match GET /api/orders/[id]/invoice                          */
/* ------------------------------------------------------------------ */

interface InvoiceMeta {
  number: string;
  date: string;
  dueDate: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
}

interface InvoiceSeller {
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  city: string | null;
}

interface InvoiceCustomer {
  name: string;
  phone: string;
  address: string | null;
  city: string | null;
}

interface InvoiceItem {
  name: string;
  sku: string;
  qty: number;
  price: number;
  total: number;
}

interface InvoiceTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

interface InvoicePayload {
  invoice: InvoiceMeta;
  seller: InvoiceSeller;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  courier: string | null;
  trackingNumber: string | null;
  notes: string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatInvoiceDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Strip everything except digits (handles 03xx → 92 3xx if local). */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  return digits;
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function InvoiceDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [data, setData] = React.useState<InvoicePayload | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !orderId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<InvoicePayload>(`/api/orders/${orderId}/invoice`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load invoice");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  /* ---- Action handlers ---- */

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    if (!data) return;
    const phone = normalizePhone(data.customer.phone);
    if (!phone) return;
    const summary = `*${data.seller.businessName}* Invoice ${data.invoice.number} — Total Rs ${Math.round(
      data.totals.total
    ).toLocaleString("en-PK")}. Shukriya! 🌿`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(summary)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const courierTrackingUrl = data?.trackingNumber
    ? `https://www.google.com/search?q=${encodeURIComponent(
        `${data.courier || ""} ${data.trackingNumber}`.trim()
      )}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 sm:rounded-2xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice / Receipt</DialogTitle>
          <DialogDescription>
            Printable invoice for order {orderId ?? ""}.
          </DialogDescription>
        </DialogHeader>

        {/* Close button — visible on screen, hidden in print */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="no-print absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-brand-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-brand-800"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto scrollbar-brand">
          {loading && <InvoiceSkeleton />}

          {!loading && error && (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-rose-700">
                Couldn&apos;t load invoice
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-brand-300 text-brand-700 hover:bg-brand-50"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="invoice-print bg-white">
              <InvoiceContent
                data={data}
                orderId={orderId}
                onPrint={handlePrint}
                onWhatsApp={handleWhatsApp}
                courierTrackingUrl={courierTrackingUrl}
                onClose={() => onOpenChange(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Invoice content (printable)                                         */
/* ------------------------------------------------------------------ */

function InvoiceContent({
  data,
  orderId,
  onPrint,
  onWhatsApp,
  courierTrackingUrl,
  onClose,
}: {
  data: InvoicePayload;
  orderId: string | null;
  onPrint: () => void;
  onWhatsApp: () => void;
  courierTrackingUrl: string | null;
  onClose: () => void;
}) {
  const { invoice, seller, customer, items, totals, courier, trackingNumber, notes } = data;

  return (
    <div className="flex flex-col">
      {/* 1. Header band */}
      <div className="bg-brand-gradient relative overflow-hidden rounded-t-lg p-5 text-white sm:p-6">
        <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {seller.businessName || "OrderNama Seller"}
            </h1>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80 sm:text-sm">
              Order Receipt / Invoice
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              <Store className="h-3 w-3" />
              Powered by OrderNama
            </div>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Store className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* 2. Invoice meta row */}
      <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-4 sm:px-6">
        <Meta label="Invoice #" value={invoice.number} />
        <Meta
          label="Date"
          value={formatInvoiceDate(invoice.date)}
          icon={<Calendar className="h-3 w-3" />}
        />
        <Meta
          label="Due Date"
          value={invoice.dueDate ? formatInvoiceDate(invoice.dueDate) : "—"}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={invoice.status} />
            <PayBadge status={invoice.paymentStatus} />
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <Separator className="bg-brand-100" />
      </div>

      {/* 3. Two-column block — From / Bill To */}
      <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 sm:px-6">
        <PartyCard
          title="From"
          icon={<Store className="h-3.5 w-3.5" />}
          rows={[
            { label: "Business", value: seller.businessName },
            { label: "Owner", value: seller.ownerName || "—" },
            { label: "Phone", value: seller.phone || "—", mono: true },
            {
              label: "WhatsApp",
              value: seller.whatsappNumber || seller.phone || "—",
              mono: true,
            },
            { label: "Email", value: seller.email || "—" },
            { label: "City", value: seller.city || "—", icon: <MapPin className="h-3 w-3" /> },
          ].filter(Boolean) as PartyRow[]}
        />
        <PartyCard
          title="Bill To"
          icon={<Phone className="h-3.5 w-3.5" />}
          rows={[
            { label: "Customer", value: customer.name },
            { label: "Phone", value: customer.phone, mono: true },
            {
              label: "Address",
              value: customer.address || "—",
              icon: <MapPin className="h-3 w-3" />,
            },
            { label: "City", value: customer.city || "—" },
          ].filter(Boolean) as PartyRow[]}
        />
      </div>

      {/* 4. Items table */}
      <div className="px-5 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-brand-200/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50/60 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-semibold sm:px-4">Item / SKU</th>
                <th className="px-2 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-3 py-2.5 text-right font-semibold sm:px-4">Price (PKR)</th>
                <th className="px-3 py-2.5 text-right font-semibold sm:px-4">Total (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr
                  key={`${it.sku || it.name}-${idx}`}
                  className={cn(
                    "border-b border-brand-100 transition hover:bg-brand-50/30",
                    idx === items.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="font-medium text-foreground">{it.name}</div>
                    {it.sku && (
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        SKU: {it.sku}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{it.qty}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums sm:px-4">
                    {formatPKR(it.price)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums sm:px-4">
                    {formatPKR(it.total)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No items on this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Totals block */}
      <div className="px-5 py-4 sm:px-6">
        <div className="ml-auto w-full max-w-xs space-y-1.5">
          <TotalRow label="Subtotal" value={formatPKR(totals.subtotal)} />
          <TotalRow label="Shipping" value={formatPKR(totals.shipping)} />
          {totals.discount > 0 && (
            <TotalRow
              label="Discount"
              value={`− ${formatPKR(totals.discount)}`}
              tone="muted"
            />
          )}
          <Separator className="my-1.5 bg-brand-200" />
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
            <span className="text-lg font-extrabold tabular-nums text-brand-700 sm:text-xl">
              {formatPKR(totals.total)}
            </span>
          </div>
          {invoice.paymentMethod && (
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] text-muted-foreground">Payment Method</span>
              <Badge
                variant="outline"
                className="border-brand-200 bg-brand-50 text-[11px] font-medium text-brand-700"
              >
                {invoice.paymentMethod}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 6. Courier block */}
      {courier && (
        <div className="px-5 sm:px-6">
          <div className="flex flex-col gap-2 rounded-xl border border-brand-200/60 bg-brand-50/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Dispatched via
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {courier}
                  {trackingNumber && (
                    <span className="ml-2 font-mono text-xs font-medium text-brand-700">
                      #{trackingNumber}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {courierTrackingUrl && trackingNumber && (
              <a
                href={courierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-print inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
              >
                <Truck className="h-3.5 w-3.5" />
                Track
              </a>
            )}
          </div>
        </div>
      )}

      {/* 7. Notes block */}
      {notes && (
        <div className="px-5 pt-4 sm:px-6">
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
            {notes}
          </p>
        </div>
      )}

      {/* 8. Footer band */}
      <div className="bg-brand-gradient-soft mt-4 rounded-b-lg p-4 text-center sm:p-5">
        <p className="text-sm font-semibold text-brand-800">
          Shukriya aapke business ka hissa banne ke liye! 🌿
        </p>
        <p className="mt-0.5 text-xs text-brand-700/80">
          — {seller.businessName}
        </p>
        {(() => {
          const wa = normalizePhone(seller.whatsappNumber || seller.phone);
          if (!wa) return null;
          return (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition hover:bg-white"
            >
              <MessageCircle className="h-3 w-3" />
              WhatsApp pe query: {seller.whatsappNumber || seller.phone}
            </a>
          );
        })()}
      </div>

      {/* Action buttons */}
      <DialogFooter className="no-print flex-wrap items-center gap-2 border-t border-brand-100 bg-white px-5 py-3 sm:px-6 sm:flex-row">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Close
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onWhatsApp}
          className="border-brand-300 text-brand-700 hover:bg-brand-50"
        >
          <MessageCircle className="h-4 w-4" />
          Send via WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/api/orders/${orderId}/pdf`, "_blank")}
          className="border-brand-300 text-brand-700 hover:bg-brand-50"
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>
        <Button
          size="sm"
          onClick={onPrint}
          className="bg-brand-gradient text-white shadow-sm hover:opacity-95"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational subcomponents                                  */
/* ------------------------------------------------------------------ */

function Meta({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-1 text-sm font-semibold text-foreground truncate tabular-nums">
        {icon}
        {value}
      </span>
    </div>
  );
}

interface PartyRow {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}

function PartyCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: PartyRow[];
}) {
  return (
    <div className="rounded-xl border border-brand-200/60 bg-brand-50/30 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
        {icon}
        {title}
      </div>
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 text-muted-foreground">{r.label}</dt>
            <dd
              className={cn(
                "min-w-0 truncate text-right font-medium text-foreground",
                r.mono && "tabular-nums"
              )}
            >
              <span className="inline-flex items-center gap-1">
                {r.icon}
                {r.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "muted";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          tone === "muted" ? "text-muted-foreground" : "font-medium text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

function InvoiceSkeleton() {
  return (
    <div className="bg-white p-5 sm:p-6">
      {/* Header */}
      <Skeleton className="h-20 w-full rounded-lg bg-brand-100/60" />
      {/* Meta */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-12 bg-brand-100/60" />
            <Skeleton className="h-4 w-20 bg-brand-100/60" />
          </div>
        ))}
      </div>
      {/* Party cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl bg-brand-100/60" />
        <Skeleton className="h-40 w-full rounded-xl bg-brand-100/60" />
      </div>
      {/* Table */}
      <Skeleton className="mt-4 h-48 w-full rounded-xl bg-brand-100/60" />
      {/* Totals */}
      <Skeleton className="mt-4 ml-auto h-24 w-72 rounded-lg bg-brand-100/60" />
      {/* Footer */}
      <Skeleton className="mt-4 h-16 w-full rounded-lg bg-brand-100/60" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* InvoiceButton — self-contained opener                               */
/* ------------------------------------------------------------------ */

export function InvoiceButton({
  orderId,
  variant = "outline",
}: {
  orderId: string;
  variant?: InvoiceButtonVariant;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "outline" &&
            "border-brand-300 text-brand-700 hover:bg-brand-50 hover:text-brand-800"
        )}
      >
        <FileText className="h-4 w-4" />
        Invoice
      </Button>
      <InvoiceDialog orderId={orderId} open={open} onOpenChange={setOpen} />
    </>
  );
}
