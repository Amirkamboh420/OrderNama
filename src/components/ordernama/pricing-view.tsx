"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle2,
  Download,
  Wallet,
  Loader2,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { api } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type SettingsResponse = {
  seller: {
    plan: string;
    currency: string;
  };
};

type Plan = {
  name: "Free" | "Pro" | "Business";
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "Rs 0",
    period: "/month",
    tagline: "Naye sellers ke liye perfect",
    features: [
      "30 orders / month",
      "1 user",
      "Basic order tracking",
      "Customer list",
      "Mobile app access",
    ],
  },
  {
    name: "Pro",
    price: "Rs 1,200",
    period: "/month",
    tagline: "Growing sellers ke liye",
    features: [
      "Unlimited orders",
      "WhatsApp automation",
      "Sales analytics",
      "Public order form link",
      "Inventory basics",
      "Excel/PDF export",
    ],
    highlight: true,
  },
  {
    name: "Business",
    price: "Rs 3,500",
    period: "/month",
    tagline: "Multi-user & scale",
    features: [
      "Everything in Pro",
      "Multi-user (staff access)",
      "Multi-store support",
      "Courier integration",
      "Repeat customer tagging",
      "Priority support",
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Kya main kabhi bhi plan change kar sakta hoon?",
    a: "Bilkul. Aap kabhi bhi upgrade ya downgrade kar sakte hain. Upgrade turant active ho jata hai, aur downgrade agle billing cycle se apply hoga. Proration automatically calculate ho jata hai.",
  },
  {
    q: "Refund policy kya hai?",
    a: "Agar aap kisi paid plan ke 7 din ke andar cancel karte hain aur use nahi karte, to hum full refund dete hain. Uske baad refund case-by-case basis pe milta hai — support se rabta karein.",
  },
  {
    q: "Local payment methods supported hain?",
    a: "Jee haan! Hum JazzCash, EasyPaisa aur bank transfer support karte hain — Pakistan sellers ke liye designed hai. Card payments (Visa/Master) bhi available hain lekin local methods recommended hain.",
  },
  {
    q: "Free plan ki limits kya hain?",
    a: "Free plan mein 30 orders per month, 1 user, basic tracking aur customer list milta hai. WhatsApp automation aur analytics Pro aur Business plans mein hain.",
  },
  {
    q: "Upgrade karne pe mera data safe rahega?",
    a: "Bilkul. Aapka data humesha safe rehta hai — plan change sirf features unlock karta hai, kuch bhi delete nahi hota. Downgrade karne par bhi data 90 tak retain hota hai.",
  },
];

const BILLING_HISTORY = [
  { date: "2025-04-01", amount: "Rs 1,200", status: "Paid", invoice: "INV-2025-0401" },
  { date: "2025-03-01", amount: "Rs 1,200", status: "Paid", invoice: "INV-2025-0301" },
  { date: "2025-02-01", amount: "Rs 1,200", status: "Paid", invoice: "INV-2025-0201" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h3>
      <Separator />
    </div>
  );
}

export function PricingView() {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<"Free" | "Pro" | "Business">("Free");
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<SettingsResponse>("/api/settings");
      setCurrentPlan(res.seller.plan as "Free" | "Pro" | "Business");
    } catch (e) {
      toast.error("Plan load nahi hua", { description: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSwitchPlan(plan: "Free" | "Pro" | "Business") {
    if (plan === currentPlan) return;
    setSwitchingPlan(plan);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ plan }),
      });
      setCurrentPlan(plan);
      toast.success(`Plan change ho gaya: ${plan}`, {
        description: `Aapka naya plan ${plan} turant active hai.`,
      });
    } catch (e) {
      toast.error("Plan change fail hua", { description: String(e) });
    } finally {
      setSwitchingPlan(null);
    }
  }

  function handleUpdatePayment() {
    toast.info("Payment update flow", {
      description: "JazzCash number update form yahan khulega (demo).",
    });
  }

  function handleDownloadInvoice(invoice: string) {
    toast.success("Invoice download shuru", {
      description: `${invoice}.pdf tayyar ho raha hai...`,
    });
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Plans &amp; Billing</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Apna plan manage karein, billing history dekhein aur payment methods update karein.
          </p>
        </div>
        <Badge className="bg-brand-gradient px-3 py-1.5 text-sm text-white">
          Current: {currentPlan}
        </Badge>
      </div>

      {/* Plan cards */}
      <section className="space-y-3">
        <SectionHeading>Available Plans</SectionHeading>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.name === currentPlan;
            const isUpgrade = ["Free", "Pro", "Business"].indexOf(p.name) >
              ["Free", "Pro", "Business"].indexOf(currentPlan);
            const isDowngrade = ["Free", "Pro", "Business"].indexOf(p.name) <
              ["Free", "Pro", "Business"].indexOf(currentPlan);

            return (
              <Card
                key={p.name}
                className={`relative overflow-hidden border border-brand-200/60 p-6 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md ${
                  p.highlight ? "ring-2 ring-brand-400" : ""
                } ${isCurrent ? "ring-2 ring-brand-400" : ""}`}
              >
                {p.highlight && !isCurrent && (
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />
                )}
                {isCurrent && (
                  <div className="absolute right-4 top-4 rounded-full bg-brand-gradient px-2.5 py-1 text-[10px] font-bold text-white">
                    CURRENT
                  </div>
                )}
                {p.highlight && !isCurrent && (
                  <div className="absolute right-4 top-4 rounded-full bg-brand-gradient px-2.5 py-1 text-[10px] font-bold text-white">
                    POPULAR
                  </div>
                )}

                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{p.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{p.period}</span>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={isCurrent || switchingPlan !== null}
                  onClick={() => handleSwitchPlan(p.name)}
                  className={`mt-6 w-full ${
                    isCurrent
                      ? "border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-50"
                      : p.highlight
                      ? "bg-brand-gradient text-white hover:opacity-90"
                      : "border border-brand-300 text-brand-700 hover:bg-brand-50"
                  }`}
                  variant={isCurrent ? "outline" : p.highlight ? "default" : "outline"}
                >
                  {switchingPlan === p.name ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : null}
                  {isCurrent
                    ? "Current Plan"
                    : isUpgrade
                    ? `Upgrade to ${p.name}`
                    : isDowngrade
                    ? `Downgrade to ${p.name}`
                    : "Switch"}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          All plans include local payment support (JazzCash / EasyPaisa / COD) · No setup fee ·
          Cancel anytime
        </p>
      </section>

      {/* Billing history */}
      <section className="space-y-3">
        <SectionHeading>Billing History</SectionHeading>
        <Card className="gap-0 p-0">
          <div className="overflow-hidden rounded-xl">
            <div className="hidden grid-cols-4 gap-4 border-b border-border bg-muted/40 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <div>Date</div>
              <div>Invoice</div>
              <div>Amount</div>
              <div className="text-right">Status &amp; Action</div>
            </div>
            <ul className="divide-y divide-border">
              {BILLING_HISTORY.map((row) => (
                <li
                  key={row.invoice}
                  className="grid grid-cols-2 gap-2 px-6 py-4 text-sm sm:grid-cols-4 sm:gap-4"
                >
                  <div className="font-medium text-foreground">{row.date}</div>
                  <div className="text-muted-foreground">{row.invoice}</div>
                  <div className="font-semibold text-foreground">{row.amount}</div>
                  <div className="flex items-center justify-end gap-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-100 text-emerald-800"
                    >
                      {row.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadInvoice(row.invoice)}
                      className="gap-1 text-brand-700 hover:bg-brand-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      {/* Payment method */}
      <section className="space-y-3">
        <SectionHeading>Payment Method</SectionHeading>
        <Card className="gap-4 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">JazzCash</div>
                <div className="text-xs text-muted-foreground">
                  Mobile account: <span className="font-mono">0300-1234567</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleUpdatePayment}
              className="border-brand-300 text-brand-700 hover:bg-brand-50"
            >
              Update
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-brand-800">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Aapka payment data encrypted aur safe hai. Local methods (JazzCash/EasyPaisa)
            recommended hain.
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <Card className="gap-0 p-0">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-lg border-b border-border px-4 last:border-b-0 data-[state=open]:bg-brand-50/30"
              >
                <AccordionTrigger className="px-2 text-sm font-semibold text-foreground hover:no-underline">
                  <span className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-brand-600" />
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-4 text-sm text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>
    </div>
  );
}
