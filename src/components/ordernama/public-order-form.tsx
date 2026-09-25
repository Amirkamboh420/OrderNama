"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  Minus,
  Send,
  CheckCircle2,
  ShoppingBag,
  Store,
  Package,
} from "lucide-react";

import { api, formatPKR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* =========================================================================
 *  Types
 * ======================================================================= */

type SettingsResponse = {
  seller: {
    id: string;
    businessName: string;
    phone: string | null;
    whatsappNumber: string | null;
    email: string | null;
    city: string | null;
  };
  setting: {
    orderFormSlug: string | null;
  } | null;
};

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  stock: number;
  lowStockAt: number;
  price: number;
};

type InventoryResponse = { items: InventoryItem[] };

type SubmitOrderResponse = {
  ok: boolean;
  orderNumber: string;
  total: number;
  businessName: string;
};

const SHIPPING = 200;

/* =========================================================================
 *  Local cart type
 * ======================================================================= */

type CartLine = {
  id: string;
  name: string;
  sku: string | undefined;
  qty: number;
  price: number;
};

/* =========================================================================
 *  PublicOrderForm
 * ======================================================================= */

export function PublicOrderForm() {
  const [settings, setSettings] = React.useState<SettingsResponse | null>(null);
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Customer info
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");

  // Per-item quantities keyed by item id (only items with qty > 0 are "selected")
  const [qtyMap, setQtyMap] = React.useState<Record<string, number>>({});

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<{ orderNumber: string; total: number } | null>(null);
  const [inventoryEmpty, setInventoryEmpty] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, inv] = await Promise.all([
          api<SettingsResponse>("/api/settings"),
          api<InventoryResponse>("/api/inventory").catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        setSettings(s);
        setItems(inv.items || []);
        setInventoryEmpty(!inv.items || inv.items.length === 0);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setLoading(false);
        toast.error("Data load nahi hua", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const businessName = settings?.seller.businessName || "OrderNama Store";
  const slug = settings?.setting?.orderFormSlug || "demo";

  // ---- Cart helpers ------------------------------------------------------

  const selectedLines: CartLine[] = React.useMemo(() => {
    return items
      .filter((it) => (qtyMap[it.id] || 0) > 0)
      .map((it) => ({
        id: it.id,
        name: it.name,
        sku: it.sku || undefined,
        qty: qtyMap[it.id] || 0,
        price: Number(it.price) || 0,
      }));
  }, [items, qtyMap]);

  const subtotal = selectedLines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = subtotal + SHIPPING;
  const hasItems = selectedLines.length > 0;
  const canSubmit = hasItems && name.trim() !== "" && phone.trim() !== "";

  function setQty(id: string, delta: number, stock: number) {
    setQtyMap((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      // Cap at stock (if stock is > 0)
      if (stock > 0 && next > stock) return { ...prev, [id]: stock };
      return { ...prev, [id]: next };
    });
  }

  function selectItem(id: string) {
    setQtyMap((prev) => {
      if (prev[id]) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: 1 };
    });
  }

  // ---- Submit ------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Form mukammal karein", {
        description: "Naam, phone aur kam az kam 1 item zaroori hai.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<SubmitOrderResponse>("/api/public/submit-order", {
        method: "POST",
        body: JSON.stringify({
          slug,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerCity: city.trim(),
          customerAddress: address.trim(),
          items: selectedLines.map((l) => ({
            name: l.name,
            sku: l.sku || null,
            qty: l.qty,
            price: l.price,
          })),
          notes: "Customer-submitted via order form",
        }),
      });
      setSuccess({ orderNumber: res.orderNumber, total: res.total });
      toast.success("Order place ho gaya!", {
        description: `Order number: ${res.orderNumber}`,
      });
      // Reset cart + customer info
      setQtyMap({});
      setName("");
      setPhone("");
      setCity("");
      setAddress("");
    } catch (err) {
      toast.error("Order submit nahi hua", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function placeAnother() {
    setSuccess(null);
  }

  // ---- Render: loading skeletons ----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50/30 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-32 rounded-t-xl" />
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // ---- Render: success state --------------------------------------------

  if (success) {
    return (
      <div className="min-h-screen bg-brand-50/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-2xl mx-auto border-brand-200/60 p-8">
          <div className="text-center py-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="mt-5 text-5xl">🎉</div>
            <h2 className="mt-3 text-2xl font-extrabold text-foreground">
              Order placed!
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Aapka order number:{" "}
              <span className="font-bold text-brand-700 text-base">
                {success.orderNumber}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatPKR(success.total)}</span>
            </p>
            <p className="mt-4 text-sm text-foreground/80">
              Hum WhatsApp pe confirm karenge. 🌿
            </p>
            <Separator className="my-6 bg-brand-100" />
            <Button
              onClick={placeAnother}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Place Another Order
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Render: main form -------------------------------------------------

  return (
    <div className="min-h-screen bg-brand-50/30">
      <div className="w-full max-w-2xl mx-auto py-6 px-4">
        <Card className="overflow-hidden border-brand-200/60 p-0">
          {/* ---------------- Header band ---------------- */}
          <div className="bg-brand-gradient text-white p-6 rounded-t-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-30" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/80">
                <Store className="size-3.5" />
                {businessName}
              </div>
              <h1 className="mt-1.5 flex items-center gap-2 text-xl font-extrabold">
                <ShoppingBag className="size-5" />
                Place Your Order
              </h1>
              <p className="mt-0.5 text-xs text-white/80">
                Apna order yahan se place karein
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-background p-5 sm:p-6 space-y-6">
            {/* ---------------- Customer info ---------------- */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Apni details
                </span>
                <Separator className="flex-1 bg-brand-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  id="pf-name"
                  label="Name"
                  required
                  value={name}
                  onChange={setName}
                  placeholder="Your full name"
                />
                <Field
                  id="pf-phone"
                  label="Phone"
                  required
                  value={phone}
                  onChange={setPhone}
                  placeholder="03001234567"
                  inputMode="tel"
                />
                <Field
                  id="pf-city"
                  label="City"
                  value={city}
                  onChange={setCity}
                  placeholder="Karachi"
                />
                <Field
                  id="pf-address"
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="House, street, area"
                />
              </div>
            </section>

            <Separator className="bg-brand-100" />

            {/* ---------------- Items ---------------- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Items select karein
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Package className="size-3" />
                  {items.length} products
                </span>
              </div>

              {inventoryEmpty ? (
                <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Package className="size-6" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Abhi koi products available nahi.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Baad mein try karein.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map((it) => {
                    const qty = qtyMap[it.id] || 0;
                    const selected = qty > 0;
                    return (
                      <div
                        key={it.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectItem(it.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectItem(it.id);
                          }
                        }}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition flex flex-col gap-2 ${
                          selected
                            ? "border-brand-400 bg-brand-50"
                            : "border-brand-100 hover:border-brand-300"
                        }`}
                        aria-pressed={selected}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                            {it.name}
                          </div>
                          <div className="mt-1 text-[11px] text-brand-700 font-semibold">
                            {formatPKR(Number(it.price) || 0)}
                          </div>
                          {it.sku && (
                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                              SKU: {it.sku}
                            </div>
                          )}
                          {it.stock > 0 && it.stock <= it.lowStockAt && (
                            <div className="mt-0.5 text-[10px] text-amber-600 font-medium">
                              Only {it.stock} left
                            </div>
                          )}
                        </div>

                        {/* Qty stepper — stopPropagation so toggling qty doesn't toggle selection */}
                        <div
                          className="inline-flex items-center gap-2 self-start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(it.id, -1, it.stock)}
                            disabled={qty <= 0}
                            aria-label="Decrease quantity"
                            className="h-8 w-8 rounded-full border border-brand-200 flex items-center justify-center text-brand-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-bold tabular-nums text-foreground">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(it.id, 1, it.stock)}
                            aria-label="Increase quantity"
                            className="h-8 w-8 rounded-full border border-brand-200 flex items-center justify-center text-brand-700 hover:bg-brand-50 transition"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ---------------- Order summary ---------------- */}
            <section className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Order Summary
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {selectedLines.length} item{selectedLines.length === 1 ? "" : "s"}
                </span>
              </div>

              {hasItems ? (
                <div className="space-y-1.5">
                  {selectedLines.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between text-sm py-0.5"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-foreground/90 truncate">
                          {l.name}
                        </span>
                        <span className="text-muted-foreground"> × {l.qty}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatPKR(l.price)}
                        </span>
                        <span className="font-semibold text-foreground tabular-nums w-20 text-right">
                          {formatPKR(l.qty * l.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2 text-center">
                  Abhi koi item select nahi kiya. Items pe click karein.
                </div>
              )}

              <Separator className="my-2 bg-brand-100" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatPKR(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatPKR(SHIPPING)}
                </span>
              </div>
              <Separator className="my-1 bg-brand-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-lg font-extrabold text-brand-700 tabular-nums">
                  {formatPKR(total)}
                </span>
              </div>
            </section>

            {/* ---------------- Submit ---------------- */}
            {canSubmit ? (
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-gradient text-white py-3 rounded-xl text-base font-bold hover:opacity-90"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Bhej rahe hain...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Order
                  </>
                )}
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="block w-full">
                    <Button
                      type="button"
                      disabled
                      className="w-full bg-brand-gradient text-white py-3 rounded-xl text-base font-bold opacity-50 cursor-not-allowed"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Order
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-foreground text-background">
                  {name.trim() === "" || phone.trim() === ""
                    ? "Naam aur phone daalein"
                    : "Kam az kam 1 item select karein"}
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              <MessageCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>
                Order submit karte hi seller ko notify ho jayega aur WhatsApp pe auto-confirm
                message chala jayega (agar enabled hai).
              </span>
            </div>
          </form>
        </Card>

        {/* ---------------- Footer ---------------- */}
        <footer className="mt-6 text-center text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Store className="size-3" />
            Powered by OrderNama · Pakistan ke sellers ke liye 🌿
          </span>
        </footer>
      </div>
    </div>
  );
}

/* =========================================================================
 *  Field — small wrapper for input + label
 * ======================================================================= */

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: "tel" | "text";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label} {required && <span className="text-rose-600">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="bg-background"
        required={required}
      />
    </div>
  );
}

// (helper components above)
