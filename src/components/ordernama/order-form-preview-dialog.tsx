"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Eye,
  Send,
  ShoppingBag,
  Store,
  X,
  MessageCircle,
  Minus,
  Plus,
  ExternalLink,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatPKR } from "@/lib/api";

/* =========================================================================
 *  Types
 * ======================================================================= */

type SampleItem = {
  name: string;
  sku: string;
  price: number;
  qty: number;
};

const SAMPLE_ITEMS: SampleItem[] = [
  { name: "Embroidered Lawn Suit", sku: "LWN-001", price: 3500, qty: 1 },
  { name: "Cotton Dupatta", sku: "DUP-002", price: 800, qty: 2 },
  { name: "Chiffon Scarf", sku: "SCF-003", price: 500, qty: 3 },
];

const SAMPLE_SHIPPING = 200;

/* =========================================================================
 *  Helper: build a wa.me link with the form data encoded as text
 * ======================================================================= */

function normalizePhone(p?: string | null): string {
  if (!p) return "";
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  if (digits.startsWith("92")) return digits;
  return digits;
}

function buildWhatsappText(opts: {
  businessName: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  items: SampleItem[];
  shipping: number;
}): string {
  const subtotal = opts.items.reduce(
    (s, it) => s + it.qty * it.price,
    0,
  );
  const total = subtotal + opts.shipping;
  const itemLines = opts.items
    .map((it, i) => `${i + 1}. ${it.name} × ${it.qty} — ${formatPKR(it.qty * it.price)}`)
    .join("\n");

  return [
    `*New Order — ${opts.businessName}*`,
    "",
    `Name: ${opts.name || "(unfilled)"}`,
    `Phone: ${opts.phone || "(unfilled)"}`,
    `Address: ${opts.address || "(unfilled)"}`,
    `City: ${opts.city || "(unfilled)"}`,
    "",
    "Items:",
    itemLines,
    "",
    `Subtotal: ${formatPKR(subtotal)}`,
    `Shipping: ${formatPKR(opts.shipping)}`,
    `Total: ${formatPKR(total)}`,
  ].join("\n");
}

/* =========================================================================
 *  OrderFormPreviewButton
 * ======================================================================= */

export function OrderFormPreviewButton({
  slug,
  businessName,
  whatsappNumber,
}: {
  slug?: string | null;
  businessName: string;
  whatsappNumber?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  // Local "form" state — editable fields for the WhatsApp preview.
  const [name, setName] = React.useState("Ayesha Khan");
  const [phone, setPhone] = React.useState("03001234567");
  const [address, setAddress] = React.useState(
    "House 12, Street 4, Block C, Gulshan-e-Iqbal",
  );
  const [city, setCity] = React.useState("Karachi");

  // Sample items — qty steppers are disabled (visual only).
  const items = SAMPLE_ITEMS;
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const total = subtotal + SAMPLE_SHIPPING;

  function sendWhatsapp() {
    const normalized = normalizePhone(whatsappNumber);
    if (!normalized) {
      toast.error("WhatsApp number set nahi hai", {
        description: "Settings me apna WhatsApp number add karein.",
      });
      return;
    }
    const text = buildWhatsappText({
      businessName,
      name,
      phone,
      address,
      city,
      items,
      shipping: SAMPLE_SHIPPING,
    });
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp pe bheja ja raha hai", {
      description: "Preview mode — real customer form alag tab khulega.",
    });
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-brand-300 text-brand-700 hover:bg-brand-50"
      >
        <Eye className="mr-2 h-4 w-4" />
        Preview form
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg gap-0 p-0 max-h-[90vh] overflow-hidden">
          {/* ---------------- Header strip (brand gradient) ---------------- */}
          <div className="bg-brand-gradient px-5 py-5 text-white">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/80">
              <Store className="size-3.5" />
              {businessName || "Your Business"}
            </div>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-bold">
              <ShoppingBag className="size-5" />
              Place your order
            </h2>
            <p className="mt-0.5 text-xs text-white/80">
              Bharpoor details daalein, phir WhatsApp pe bhej dein.
            </p>
          </div>

          {/* ---------------- Dialog header (sr-only title for a11y) ---------------- */}
          <DialogHeader className="sr-only">
            <DialogTitle>Public order form preview</DialogTitle>
            <DialogDescription>
              A non-functional mockup of the customer-facing order form. This is
              how customers will see it when you share your form link.
            </DialogDescription>
          </DialogHeader>

          {/* ---------------- Body (mobile-form style) ---------------- */}
          <div className="scrollbar-brand overflow-y-auto bg-brand-50/30 px-5 py-5 space-y-5">
            {/* Customer fields */}
            <section className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                Your details
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="pf-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-phone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="pf-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    inputMode="tel"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-address" className="text-xs">
                    Address
                  </Label>
                  <Input
                    id="pf-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, street, area"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-city" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="pf-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karachi"
                    className="bg-background"
                  />
                </div>
              </div>
            </section>

            <Separator className="bg-brand-100" />

            {/* Items picker (disabled steppers) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Pick items
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Sample items
                </span>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-brand-100 bg-background p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {it.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        SKU: {it.sku} · {formatPKR(it.price)}
                      </div>
                    </div>
                    {/* Disabled qty stepper */}
                    <div className="flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50/40 p-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled
                        aria-label="Decrease quantity"
                        className="size-7 text-brand-700"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-foreground">
                        {it.qty}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled
                        aria-label="Increase quantity"
                        className="size-7 text-brand-700"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <div className="w-16 text-right text-sm font-semibold tabular-nums text-foreground">
                      {formatPKR(it.qty * it.price)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Totals */}
            <section className="rounded-lg border border-brand-100 bg-brand-50/60 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatPKR(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatPKR(SAMPLE_SHIPPING)}
                </span>
              </div>
              <Separator className="my-1 bg-brand-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Total
                </span>
                <span className="text-lg font-bold text-brand-700 tabular-nums">
                  {formatPKR(total)}
                </span>
              </div>
            </section>

            {/* Note */}
            <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              <MessageCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>
                Yeh aapke customers ko dikhega jab aap apna form link share
                karenge.
              </span>
            </div>
          </div>

          {/* ---------------- Footer ---------------- */}
          <DialogFooter className="border-t border-brand-100 bg-background px-5 py-4 sm:justify-between gap-2">
            {slug ? (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate max-w-[55%]">
                <ExternalLink className="size-3 shrink-0" />
                <span className="truncate">/order/{slug}</span>
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                Set your form slug in settings
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-muted-foreground"
              >
                <X className="size-4" />
                Close
              </Button>
              <Button
                onClick={sendWhatsapp}
                className="bg-brand-gradient text-white hover:opacity-90"
              >
                <Send className="size-4" />
                Send order via WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
