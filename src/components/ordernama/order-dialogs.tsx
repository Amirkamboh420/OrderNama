"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Send,
  Phone,
  MapPin,
  Instagram,
  Truck,
  Package,
  X,
  Clock,
  CheckCircle2,
  Circle,
  MessageCircle,
  ExternalLink,
  Loader2,
  StickyNote,
  Copy,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, formatPKR, timeAgo } from "@/lib/api";
import { useApp } from "@/lib/store";
import { StatusBadge, PayBadge } from "@/components/ordernama/badges";
import { InvoiceButton } from "@/components/ordernama/invoice-dialog";

/* =========================================================================
 *  Types
 * ======================================================================= */

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
};

type ItemRow = {
  name: string;
  sku?: string;
  qty: number;
  price: number;
};

type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  courier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  source: string;
  items: ItemRow[];
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    address: string | null;
  };
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  courier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  source: string;
  items: ItemRow[];
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    address: string | null;
    instagram: string | null;
    notes: string | null;
    totalOrders: number;
    totalSpent: number;
    isRepeat: boolean;
  };
  timeline: { status: string; at: string; note?: string }[];
  whatsappLogs: {
    id: string;
    toPhone: string;
    message: string;
    status: string;
    createdAt: string;
  }[];
};

const STATUS_FLOW = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;
const PAYMENT_METHODS = ["COD", "JazzCash", "EasyPaisa", "Bank"] as const;

/* =========================================================================
 *  Shared "create similar order" template type
 * ======================================================================= */

export type OrderTemplate = {
  customerName?: string;
  customerPhone?: string;
  items?: { name: string; sku?: string; qty: number; price: number }[];
  shipping?: number;
  discount?: number;
};

/* =========================================================================
 *  Small shared helpers
 * ======================================================================= */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* =========================================================================
 *  CreateOrderDialog
 * ======================================================================= */

export function CreateOrderDialog({
  open,
  onOpenChange,
  onCreated,
  initialTemplate,
  onTemplateConsumed,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated?: () => void;
  initialTemplate?: OrderTemplate | null;
  onTemplateConsumed?: () => void;
}) {
  // Customer fields
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerCity, setCustomerCity] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [customerInstagram, setCustomerInstagram] = React.useState("");
  const [customerNotes, setCustomerNotes] = React.useState("");

  // Items
  const [items, setItems] = React.useState<
    { invId: string; name: string; sku?: string; qty: number; price: number }[]
  >([{ invId: "", name: "", sku: "", qty: 1, price: 0 }]);

  // Totals / settings
  const [shipping, setShipping] = React.useState<number>(200);
  const [discount, setDiscount] = React.useState<number>(0);
  const [status, setStatus] = React.useState<string>("Pending");
  const [paymentStatus, setPaymentStatus] = React.useState<string>("Unpaid");
  const [paymentMethod, setPaymentMethod] = React.useState<string>("COD");
  const [courier, setCourier] = React.useState<string>("");
  const [trackingNumber, setTrackingNumber] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const subtotal = React.useMemo(
    () => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal + (Number(shipping) || 0) - (Number(discount) || 0));

  // Fetch inventory on open
  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    setInvLoading(true);
    api<{ items: InventoryItem[] }>("/api/inventory")
      .then((r) => {
        if (alive) setInventory(r.items || []);
      })
      .catch(() => {
        if (alive) setInventory([]);
      })
      .finally(() => alive && setInvLoading(false));
    return () => {
      alive = false;
    };
  }, [open]);

  // Pre-fill form from a "create similar order" template (passed by parent).
  // Runs whenever the parent supplies a non-null template. After applying, the
  // parent is notified via onTemplateConsumed so it can clear its own state.
  React.useEffect(() => {
    if (!initialTemplate) return;
    if (typeof initialTemplate.customerName === "string")
      setCustomerName(initialTemplate.customerName);
    if (typeof initialTemplate.customerPhone === "string")
      setCustomerPhone(initialTemplate.customerPhone);
    if (Array.isArray(initialTemplate.items) && initialTemplate.items.length > 0) {
      setItems(
        initialTemplate.items.map((it) => ({
          invId: "",
          name: it.name,
          sku: it.sku || "",
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0,
        })),
      );
    }
    if (typeof initialTemplate.shipping === "number")
      setShipping(initialTemplate.shipping);
    if (typeof initialTemplate.discount === "number")
      setDiscount(initialTemplate.discount);
    onTemplateConsumed?.();
  }, [initialTemplate]);

  function resetForm() {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerCity("");
    setCustomerAddress("");
    setCustomerInstagram("");
    setCustomerNotes("");
    setItems([{ invId: "", name: "", sku: "", qty: 1, price: 0 }]);
    setShipping(200);
    setDiscount(0);
    setStatus("Pending");
    setPaymentStatus("Unpaid");
    setPaymentMethod("COD");
    setCourier("");
    setTrackingNumber("");
    setNotes("");
  }

  function updateItem(idx: number, patch: Partial<(typeof items)[number]>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function selectInventory(idx: number, invId: string) {
    const inv = inventory.find((i) => i.id === invId);
    if (!inv) {
      updateItem(idx, { invId: "", name: "", sku: "", price: 0 });
      return;
    }
    updateItem(idx, {
      invId: inv.id,
      name: inv.name,
      sku: inv.sku || "",
      price: inv.price,
    });
  }

  function addItem() {
    setItems((p) => [...p, { invId: "", name: "", sku: "", qty: 1, price: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const cleanItems = items
      .filter((it) => it.name && Number(it.qty) > 0)
      .map((it) => ({
        name: it.name,
        sku: it.sku || undefined,
        qty: Number(it.qty),
        price: Number(it.price) || 0,
      }));
    if (cleanItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          customerCity,
          customerInstagram,
          customerNotes,
          items: cleanItems,
          shipping: Number(shipping) || 0,
          discount: Number(discount) || 0,
          status,
          paymentStatus,
          paymentMethod,
          courier: courier || undefined,
          trackingNumber: trackingNumber || undefined,
          notes: notes || undefined,
          source: "Manual",
        }),
      });
      toast.success("Order ban gaya! 🌿");
      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error("Order create nahi hua", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="space-y-1 px-6 pt-6 pb-3">
          <DialogTitle className="text-brand-gradient text-xl font-bold">
            New Order
          </DialogTitle>
          <DialogDescription>
            Manually add a customer order. Inventory stock auto-decreases on save.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col overflow-hidden"
        >
          <div className="scrollbar-brand overflow-y-auto px-6 pb-4 space-y-6">
            {/* ---------------- Customer ---------------- */}
            <section className="space-y-3">
              <SectionHeading>Customer</SectionHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ayesha Khan"
                  />
                </Field>
                <Field label="Phone (required)">
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03001234567"
                    inputMode="tel"
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Karachi"
                  />
                </Field>
                <Field label="Instagram handle">
                  <Input
                    value={customerInstagram}
                    onChange={(e) => setCustomerInstagram(e.target.value)}
                    placeholder="@ayesha.khan"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="House 12, Street 4, Block C, Gulshan"
                      className="min-h-12"
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Customer notes">
                    <Input
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Prefers cash, evening delivery"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <Separator />

            {/* ---------------- Items ---------------- */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeading>Items</SectionHeading>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addItem}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              </div>

              {invLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Column hints */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1" />
                  </div>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center rounded-lg border border-brand-100 bg-brand-50/30 p-2"
                    >
                      <div className="col-span-12 md:col-span-5">
                        <Select
                          value={it.invId}
                          onValueChange={(v) => selectInventory(idx, v)}
                        >
                          <SelectTrigger className="w-full h-9 bg-background">
                            {it.invId === "" && it.name ? (
                              <span className="flex items-center justify-between w-full gap-2 overflow-hidden">
                                <span className="truncate text-sm font-medium text-foreground">
                                  {it.name}
                                </span>
                                {it.sku && (
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    SKU: {it.sku}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <SelectValue placeholder="Pick item" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.length === 0 ? (
                              <SelectItem value="__none" disabled>
                                No inventory
                              </SelectItem>
                            ) : (
                              inventory.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  <span className="flex items-center justify-between w-full">
                                    <span className="truncate">{inv.name}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                      Rs {inv.price} · {inv.stock} in stock
                                    </span>
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) =>
                            updateItem(idx, { qty: Number(e.target.value) })
                          }
                          className="h-9 text-right"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          value={it.price}
                          onChange={(e) =>
                            updateItem(idx, { price: Number(e.target.value) })
                          }
                          className="h-9 text-right"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 text-right text-sm font-semibold">
                        {formatPKR(it.qty * it.price)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 text-rose-500 hover:bg-rose-50"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtotal row */}
              <div className="flex justify-end pt-1">
                <div className="text-sm text-muted-foreground">
                  Subtotal:{" "}
                  <span className="font-semibold text-foreground">
                    {formatPKR(subtotal)}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* ---------------- Totals ---------------- */}
            <section className="space-y-3">
              <SectionHeading>Totals</SectionHeading>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Shipping (PKR)">
                  <Input
                    type="number"
                    min={0}
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value))}
                  />
                </Field>
                <Field label="Discount (PKR)">
                  <Input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-brand-gradient-soft border border-brand-100 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <span className="text-lg font-bold text-brand-700">
                  {formatPKR(total)}
                </span>
              </div>
            </section>

            <Separator />

            {/* ---------------- Status / Payment ---------------- */}
            <section className="space-y-3">
              <SectionHeading>Status & Payment</SectionHeading>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Status">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FLOW.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Payment">
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Method">
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Courier">
                  <Input
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="TCS / Leopards"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Tracking #">
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Order notes">
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes"
                    />
                  </Field>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="border-t border-brand-100 px-6 py-4 bg-brand-50/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Package className="size-4" />
              )}
              Create order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
 *  OrderDetailDialog
 * ======================================================================= */

export function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
  onUpdated,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onUpdated?: () => void;
}) {
  const [detail, setDetail] = React.useState<OrderDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState<string | null>(null);
  const [waMessage, setWaMessage] = React.useState("");
  const [waSending, setWaSending] = React.useState(false);
  const [waOpen, setWaOpen] = React.useState(false);

  // Fetch when orderId changes & dialog opens
  React.useEffect(() => {
    if (!open || !orderId) {
      setDetail(null);
      return;
    }
    let alive = true;
    setLoading(true);
    api<OrderDetail>(`/api/orders/${orderId}`)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, orderId]);

  async function refetch() {
    if (!orderId) return;
    const d = await api<OrderDetail>(`/api/orders/${orderId}`);
    setDetail(d);
  }

  async function updateStatus(s: string) {
    if (!orderId) return;
    setUpdatingStatus(s);
    try {
      await api(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: s }),
      });
      toast.success(`Status → ${s}`);
      await refetch();
      onUpdated?.();
    } catch (err) {
      toast.error("Status update failed", {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function sendWhatsapp() {
    if (!orderId || !waMessage.trim()) return;
    setWaSending(true);
    try {
      await api("/api/whatsapp", {
        method: "POST",
        body: JSON.stringify({ orderId, message: waMessage.trim() }),
      });
      toast.success("WhatsApp message sent 🌿");
      setWaMessage("");
      setWaOpen(false);
      await refetch();
      onUpdated?.();
    } catch (err) {
      toast.error("Send failed", {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setWaSending(false);
    }
  }

  const phone = detail?.customer?.phone || "";
  const waLink = phone
    ? `https://wa.me/${phone.replace(/^0/, "92")}?text=${encodeURIComponent(
        `Salam ${detail?.customer?.name || ""}, aapka order ${detail?.orderNumber || ""} -`,
      )}`
    : "#";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0 max-h-[92vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-brand-gradient text-xl font-bold">
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                detail?.orderNumber || "Order"
              )}
            </DialogTitle>
            {detail && <StatusBadge status={detail.status} />}
            {detail && <PayBadge status={detail.paymentStatus} />}
            {detail?.source && (
              <Badge variant="outline" className="border-brand-200 text-brand-700">
                {detail.source}
              </Badge>
            )}
            {detail && (
              <div className="ml-auto">
                <InvoiceButton orderId={detail.id} variant="outline" />
              </div>
            )}
          </div>
          <DialogDescription>
            {detail
              ? `Created ${timeAgo(detail.createdAt)} · Updated ${timeAgo(
                  detail.updatedAt,
                )}`
              : "Loading order…"}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="scrollbar-brand overflow-y-auto px-6 pb-2">
          {loading ? (
            <DetailSkeleton />
          ) : detail ? (
            <Tabs defaultValue="overview" className="gap-3">
              <TabsList className="h-9 flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="items">
                  Items ({detail.items.length})
                </TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="whatsapp">
                  WhatsApp ({detail.whatsappLogs.length})
                </TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-4 pt-2">
                {/* Customer card */}
                <Card className="gap-3 p-4 border-brand-100 bg-brand-50/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {detail.customer.name}
                        </span>
                        {detail.customer.isRepeat && (
                          <Badge
                            variant="outline"
                            className="border-brand-300 text-brand-700 bg-brand-50"
                          >
                            Repeat customer
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-brand-700 hover:underline w-fit"
                        >
                          <Phone className="size-3.5" />
                          {detail.customer.phone}
                        </a>
                        {detail.customer.city && (
                          <div className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            {detail.customer.city}
                          </div>
                        )}
                        {detail.customer.address && (
                          <div className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            {detail.customer.address}
                          </div>
                        )}
                        {detail.customer.instagram && (
                          <div className="inline-flex items-center gap-1.5">
                            <Instagram className="size-3.5" />
                            {detail.customer.instagram}
                          </div>
                        )}
                        {detail.customer.notes && (
                          <div className="inline-flex items-start gap-1.5">
                            <StickyNote className="size-3.5 mt-0.5" />
                            <span>{detail.customer.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="border-brand-200 text-brand-700 hover:bg-brand-50"
                    >
                      <a href={waLink} target="_blank" rel="noreferrer">
                        <Send className="size-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                  {detail.customer.totalOrders > 1 && (
                    <div className="text-[11px] text-muted-foreground pt-1 border-t border-brand-100">
                      {detail.customer.totalOrders} orders ·{" "}
                      {formatPKR(detail.customer.totalSpent)} lifetime
                    </div>
                  )}
                </Card>

                {/* Totals + Delivery */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Card className="gap-2 p-4 border-brand-100">
                    <SectionHeading>Payment</SectionHeading>
                    <div className="space-y-1.5 text-sm">
                      <Row label="Method" value={detail.paymentMethod || "—"} />
                      <Row label="Payment status" value={detail.paymentStatus} />
                      <Separator className="my-1" />
                      <Row
                        label="Subtotal"
                        value={formatPKR(detail.subtotal)}
                      />
                      <Row
                        label="Shipping"
                        value={formatPKR(detail.shipping)}
                      />
                      <Row
                        label="Discount"
                        value={`- ${formatPKR(detail.discount)}`}
                      />
                      <div className="flex items-center justify-between pt-1 font-bold text-brand-700">
                        <span>Total</span>
                        <span>{formatPKR(detail.total)}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="gap-2 p-4 border-brand-100">
                    <SectionHeading>Delivery</SectionHeading>
                    <div className="space-y-1.5 text-sm">
                      <Row label="Courier" value={detail.courier || "—"} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Tracking #</span>
                        {detail.trackingNumber ? (
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(
                              detail.trackingNumber,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                          >
                            {detail.trackingNumber}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      {detail.notes && (
                        <>
                          <Separator className="my-1" />
                          <div className="inline-flex items-start gap-1.5 text-muted-foreground">
                            <StickyNote className="size-3.5 mt-0.5" />
                            <span>{detail.notes}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Status update buttons */}
                <div className="space-y-2">
                  <SectionHeading>Update status</SectionHeading>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {STATUS_FLOW.map((s) => {
                      const isCurrent = detail.status === s;
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={isCurrent ? "default" : "outline"}
                          onClick={() => updateStatus(s)}
                          disabled={updatingStatus === s || isCurrent}
                          className={cn(
                            isCurrent
                              ? "bg-brand-gradient text-white"
                              : "border-brand-200 text-brand-700 hover:bg-brand-50",
                            s === "Cancelled" && !isCurrent
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "",
                          )}
                        >
                          {updatingStatus === s ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            s
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Create similar order — pre-fills the New Order dialog with this order's details */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      Repeat order for same customer?
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Items, shipping, discount copy ho jaayenge — review karke save karein.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!detail) return;
                      const template = {
                        customerName: detail.customer?.name,
                        customerPhone: detail.customer?.phone,
                        items: detail.items.map((it) => ({
                          name: it.name,
                          sku: it.sku,
                          qty: Number(it.qty) || 1,
                          price: Number(it.price) || 0,
                        })),
                        shipping: Number(detail.shipping) || 0,
                        discount: Number(detail.discount) || 0,
                      };
                      // Set template + navigate FIRST, then close this dialog.
                      // Delay the trigger fire so Radix's focus restoration on
                      // the closing OrderDetailDialog doesn't block the new
                      // CreateOrderDialog from mounting/opening.
                      useApp.getState().setPendingOrderTemplate(template);
                      useApp.getState().setView("orders");
                      onOpenChange(false);
                      toast.info(
                        "Order details copy ho gaye — confirm karke save karein",
                      );
                      window.setTimeout(() => {
                        useApp.getState().fireDuplicateOrder();
                      }, 200);
                    }}
                    className="border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    <Copy className="size-3.5" />
                    Create similar order
                  </Button>
                </div>
              </TabsContent>

              {/* Items */}
              <TabsContent value="items" className="pt-2">
                <div className="rounded-lg border border-brand-100 overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-brand-50/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {detail.items.map((it, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-t border-brand-100 hover:bg-brand-50/40"
                    >
                      <div className="col-span-6">
                        <div className="font-medium">{it.name}</div>
                        {it.sku && (
                          <div className="text-[11px] text-muted-foreground">
                            SKU: {it.sku}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-right">{it.qty}</div>
                      <div className="col-span-2 text-right">
                        {formatPKR(it.price)}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatPKR(it.qty * it.price)}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-12 gap-2 bg-brand-50/60 px-3 py-2 text-sm border-t border-brand-100 font-semibold">
                    <div className="col-span-10 text-right">Total</div>
                    <div className="col-span-2 text-right text-brand-700">
                      {formatPKR(detail.total)}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Timeline */}
              <TabsContent value="timeline" className="pt-2">
                <Timeline detail={detail} />
              </TabsContent>

              {/* WhatsApp */}
              <TabsContent value="whatsapp" className="pt-2 space-y-3">
                {!waOpen ? (
                  <Button
                    size="sm"
                    onClick={() => setWaOpen(true)}
                    className="bg-brand-gradient text-white hover:opacity-90"
                  >
                    <Send className="size-3.5" />
                    Send new WhatsApp
                  </Button>
                ) : (
                  <Card className="gap-2 p-3 border-brand-100 bg-brand-50/30">
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      value={waMessage}
                      onChange={(e) => setWaMessage(e.target.value)}
                      placeholder="Salam! Aapka order confirm ho gaya hai…"
                      className="min-h-16"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setWaOpen(false);
                          setWaMessage("");
                        }}
                      >
                        <X className="size-3.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={sendWhatsapp}
                        disabled={waSending || !waMessage.trim()}
                        className="bg-brand-gradient text-white"
                      >
                        {waSending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        Send
                      </Button>
                    </div>
                  </Card>
                )}

                <div className="space-y-2">
                  {detail.whatsappLogs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      <MessageCircle className="size-5 mx-auto mb-2 opacity-50" />
                      No messages sent yet.
                    </div>
                  ) : (
                    detail.whatsappLogs.map((w) => (
                      <div
                        key={w.id}
                        className="bg-brand-50/40 rounded-lg p-2.5 flex items-start gap-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{w.message}</p>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            to {w.toPhone} · {timeAgo(w.createdAt)}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0",
                            w.status === "sent"
                              ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                              : w.status === "delivered"
                                ? "border-brand-200 text-brand-700 bg-brand-50"
                                : "border-rose-200 text-rose-600 bg-rose-50",
                          )}
                        >
                          {w.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-10">
              Could not load order.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

/* ---- Timeline (vertical stepper) ---- */
function Timeline({ detail }: { detail: OrderDetail }) {
  // Build display steps. If cancelled, show Pending → Cancelled branch.
  const cancelled = detail.status === "Cancelled";
  const steps = cancelled
    ? ["Pending", "Cancelled"]
    : ["Pending", "Confirmed", "Shipped", "Delivered"];
  const reached = new Set(detail.timeline.map((t) => t.status));

  return (
    <div className="space-y-1">
      {steps.map((s, idx) => {
        const done = reached.has(s);
        const isLast = idx === steps.length - 1;
        const entry = detail.timeline.find((t) => t.status === s);
        return (
          <div key={s} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center pt-0.5">
              {done ? (
                <div className="size-5 rounded-full bg-brand-gradient flex items-center justify-center text-white">
                  <CheckCircle2 className="size-3.5" />
                </div>
              ) : (
                <div className="size-5 rounded-full border-2 border-muted-foreground/40 bg-background flex items-center justify-center">
                  <Circle className="size-2.5 text-muted-foreground/50" />
                </div>
              )}
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 mt-1 mb-1 min-h-6",
                    done ? "bg-brand-gradient" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s}
                </span>
                {entry && (
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {timeAgo(entry.at)}
                  </span>
                )}
              </div>
              {entry?.note && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Loading skeleton ---- */
function DetailSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
