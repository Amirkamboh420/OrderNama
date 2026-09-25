"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  Phone,
  Mail,
  Send,
  ShoppingBag,
  Store,
  Truck,
  ShieldCheck,
  Package,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* =========================================================================
 *  Types
 * ======================================================================= */

type SettingsResponse = {
  seller: {
    id: string;
    businessName: string;
    ownerName: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    email: string | null;
    city: string | null;
  };
  setting: {
    orderFormSlug: string | null;
  } | null;
};

type TicketSubmitResponse = { id: string; ok: boolean };

/* =========================================================================
 *  Helpers
 * ======================================================================= */

/** Convert a Pakistan phone to wa.me friendly international digits. */
function normalizePhone(p?: string | null): string {
  if (!p) return "";
  const digits = p.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  if (digits.startsWith("92")) return digits;
  return digits;
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Order kaise place karun?",
    a: "Order form link pe click karein, apna naam, phone, address daalein, items select karein, aur submit karein. Hum WhatsApp pe confirm karenge.",
  },
  {
    q: "Payment kaise karun?",
    a: "Hum Cash on Delivery (COD), JazzCash, aur EasyPaisa accept karte hain.",
  },
  {
    q: "Delivery kitne din mein hogi?",
    a: "3-5 working days mein delivery hoti hai. TCS/Leopards ke through bheja jata hai.",
  },
  {
    q: "Refund policy kya hai?",
    a: "7 din ke andar refund/exchange available hai. Product unused hona chahiye.",
  },
  {
    q: "Bulk orders pe discount?",
    a: "Haan! Bulk orders pe special discount available hai. WhatsApp pe contact karein.",
  },
];

/* =========================================================================
 *  ContactView
 * ======================================================================= */

export function ContactView() {
  const [settings, setSettings] = React.useState<SettingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Contact form state
  const [formName, setFormName] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<SettingsResponse>("/api/settings");
        if (!cancelled) {
          setSettings(data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) setLoading(false);
        // Don't toast — links just won't render
        console.error("settings fetch failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsappNumber = settings?.seller.whatsappNumber || settings?.seller.phone || null;
  const sellerPhone = settings?.seller.phone || settings?.seller.whatsappNumber || null;
  const email = settings?.seller.email || null;

  const waLink = React.useMemo(() => {
    const n = normalizePhone(whatsappNumber);
    if (!n) return null;
    const text = encodeURIComponent(
      `Assalamualaikum ${settings?.seller.businessName || ""}, mujhe aapki help chahiye.`,
    );
    return `https://wa.me/${n}?text=${text}`;
  }, [whatsappNumber, settings?.seller.businessName]);

  const telLink = sellerPhone ? `tel:${sellerPhone.replace(/\s+/g, "")}` : null;
  const mailtoLink = email
    ? `mailto:${email}?subject=${encodeURIComponent("Support request — OrderNama")}`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject aur message dono daalein");
      return;
    }
    setSubmitting(true);
    try {
      await api<TicketSubmitResponse>("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          message: `${message.trim()}${formName ? `\n— ${formName}` : ""}${formPhone ? `\nPhone: ${formPhone}` : ""}`,
          category: "general",
        }),
      });
      toast.success("Message bhej diya! Hum jald reply karenge.");
      setFormName("");
      setFormPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error("Message bhejne mein masla", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-brand-gradient animate-gradient-shift text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-lime-bright opacity-50 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <MessageCircle className="h-3.5 w-3.5" />
            Support · Hum yahan madad ke liye hain
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
            Hum yahan madad ke liye hain. WhatsApp, phone, ya email — jo aasani ho.
          </p>
        </div>
      </section>

      {/* ---------------- Contact option cards ---------------- */}
      <section className="mx-auto max-w-7xl px-6 -mt-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContactCard
              icon={<MessageCircle className="h-6 w-6" />}
              title="WhatsApp"
              desc="Fastest response. Chat karein aur hum jald reply karenge."
              actionLabel="Chat on WhatsApp"
              actionHref={waLink}
              accent="whatsapp"
            />
            <ContactCard
              icon={<Phone className="h-6 w-6" />}
              title="Phone"
              desc="Direct call karein. Working hours: 9am — 7pm."
              actionLabel="Call Us"
              actionHref={telLink}
              accent="brand"
            />
            <ContactCard
              icon={<Mail className="h-6 w-6" />}
              title="Email"
              desc="Detail mein likhein, hum 24 hours mein reply karenge."
              actionLabel="Email Us"
              actionHref={mailtoLink}
              accent="amber"
            />
          </div>
        )}
      </section>

      {/* ---------------- FAQ + Form ---------------- */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* FAQ */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              FAQ
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-foreground">
              Aksar puchhe jane wale sawaal
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Yahan common sawaalaat ke jawaab hain. Aur koi masla ho to neeche form bhar dein.
            </p>

            <Accordion
              type="single"
              collapsible
              defaultValue="faq-0"
              className="mt-6 border border-brand-200/60 rounded-xl overflow-hidden bg-white"
            >
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="px-4 border-brand-100 data-[state=open]:bg-brand-50/40"
                >
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <TrustBadge icon={<Truck className="h-4 w-4" />} label="3-5 day delivery" />
              <TrustBadge icon={<ShieldCheck className="h-4 w-4" />} label="7-day refunds" />
              <TrustBadge icon={<Package className="h-4 w-4" />} label="Bulk discounts" />
            </div>
          </div>

          {/* Contact form */}
          <Card className="border-brand-200/60 p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Message bhejein</h3>
                <p className="text-xs text-muted-foreground">
                  Hum jald hi aap se raabta karenge.
                </p>
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name" className="text-xs">
                    Naam
                  </Label>
                  <Input
                    id="c-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Aapka naam"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="c-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="03001234567"
                    inputMode="tel"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-subject" className="text-xs">
                  Subject <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="c-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Aapka sawaal kya hai?"
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-message" className="text-xs">
                  Message <span className="text-rose-600">*</span>
                </Label>
                <Textarea
                  id="c-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Apna message yahan likhein..."
                  rows={5}
                  required
                  className="bg-background resize-none"
                />
              </div>
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
                    Send Message
                  </>
                )}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Submit karne se support ticket ban jayega — hum jald reply karenge.
              </p>
            </form>
          </Card>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="mt-auto border-t border-brand-100 bg-brand-50/40">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                {settings?.seller.businessName || "OrderNama"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Pakistan ke sellers ke liye banaya gaya. 🌿
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            <span>© {new Date().getFullYear()} OrderNama. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================================
 *  Sub-components
 * ======================================================================= */

function ContactCard({
  icon,
  title,
  desc,
  actionLabel,
  actionHref,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  actionLabel: string;
  actionHref: string | null;
  accent: "whatsapp" | "brand" | "amber";
}) {
  const accentBg =
    accent === "whatsapp"
      ? "bg-emerald-100 text-emerald-700"
      : accent === "brand"
        ? "bg-brand-100 text-brand-700"
        : "bg-amber-100 text-amber-700";

  const btnClass =
    accent === "whatsapp"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : accent === "brand"
        ? "bg-brand-gradient text-white hover:opacity-90"
        : "bg-amber-500 hover:bg-amber-600 text-white";

  return (
    <Card className="border-brand-200/60 p-6 text-center hover-lift">
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${accentBg}`}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      <Separator className="my-4 bg-brand-100" />
      {actionHref ? (
        <a
          href={actionHref}
          target={actionHref.startsWith("http") ? "_blank" : undefined}
          rel={actionHref.startsWith("http") ? "noopener noreferrer" : undefined}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${btnClass}`}
        >
          {actionLabel}
        </a>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-2.5 text-sm text-muted-foreground">
          Set nahi hai
        </div>
      )}
    </Card>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/40 p-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        {icon}
      </span>
      <span className="text-[11px] font-medium text-foreground/80">{label}</span>
    </div>
  );
}
