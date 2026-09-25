"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Smartphone,
  MessageCircle,
  Wallet,
  Package,
  BarChart3,
  Bell,
  Star,
  Zap,
  ShoppingBag,
  Users,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ordernama/animated-number";

/**
 * useInView — fires once when the ref element scrolls into view.
 * Uses IntersectionObserver; disconnects after the first intersection so the
 * callback never re-fires (perfect for triggering count-up animations).
 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  return { ref, inView };
}

export function MarketingLanding() {
  const { enterApp, setView } = useApp();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 420);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <div className="bg-white">
      <Hero onEnter={enterApp} onPricing={() => setView("pricing")} />
      <TrustBar />
      <ProblemSolution onEnter={enterApp} />
      <Features onEnter={enterApp} />
      <HowItWorks />
      <ProductPreview onEnter={enterApp} />
      <Testimonials />
      <Pricing onPickPlan={enterApp} />
      <FinalCTA onEnter={enterApp} />
      <Footer />
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-brand-900/25 ring-1 ring-white/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 sm:bottom-8 sm:right-8 ${showBackToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ onEnter, onPricing }: { onEnter: () => void; onPricing: () => void }) {
  return (
    <section className="relative overflow-hidden bg-brand-gradient animate-gradient-shift">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-lime-bright opacity-60 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:px-8 lg:py-20 xl:gap-12 xl:px-10">
        {/* Left copy */}
        <div className="max-w-[620px] text-white">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="leading-relaxed">Made for Pakistan&apos;s Instagram & WhatsApp sellers</span>
          </div>
          <h1 className="mt-5 max-w-[560px] text-[clamp(3.2rem,7vw,8rem)] font-extrabold leading-[0.82] tracking-[-0.07em] text-white">
            Excel chhodo.
            <br />
            <span className="bg-white bg-clip-text text-transparent">Orders ek jagah manage karo.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
            OrderNama ek simple mobile-friendly tool hai jo aapke Instagram aur WhatsApp orders ko
            ek jagah rakhta hai — order entry, customer tracking, delivery status, payment record,
            aur automatic WhatsApp confirmation. Sab kuch bilkul simple.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              onClick={onEnter}
              className="w-full bg-white text-brand-800 shadow-xl hover:bg-white/90 sm:w-auto"
            >
              Free Trial Shuru Karein
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onPricing}
              className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Pricing Dekhein
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/80 sm:gap-x-6 sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-white" /> 30 orders free / month
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-white" /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-white" /> Roman Urdu support
            </span>
          </div>
        </div>

        {/* Right preview card */}
        <div className="relative w-full max-w-[560px] animate-float justify-self-center lg:justify-self-end">
          <div className="absolute -inset-4 rounded-3xl bg-white/10 blur-2xl" />
          <div className="relative rounded-3xl border border-white/30 bg-white p-3 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-brand-100 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">Today&apos;s Orders</div>
                  <div className="text-[10px] text-muted-foreground">12 new · 4 pending</div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Live
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Revenue" value="Rs 28,500" tone="emerald" />
              <MiniStat label="Orders" value="48" tone="brand" />
              <MiniStat label="Pending" value="6" tone="amber" />
            </div>

            <div className="mt-4 space-y-2">
              <OrderRow num="ORD-1048" name="Ayesha K." total="Rs 2,700" status="Delivered" tone="emerald" />
              <OrderRow num="ORD-1047" name="Fatima N." total="Rs 1,400" status="Shipped" tone="purple" />
              <OrderRow num="ORD-1046" name="Sana M." total="Rs 3,200" status="Confirmed" tone="blue" />
              <OrderRow num="ORD-1045" name="Hira S." total="Rs 950" status="Pending" tone="amber" />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 p-2.5 text-[10px] text-brand-800 ring-1 ring-brand-200 sm:text-[11px]">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">WhatsApp sent</span>
              <span className="min-w-0 text-brand-700/70">— &quot;Aapka order ORD-1048 confirm ho gaya hai!&quot;</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "emerald" | "brand" | "amber" }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : tone === "brand"
      ? "bg-brand-50 text-brand-800 ring-brand-200"
      : "bg-amber-50 text-amber-800 ring-amber-200";
  return (
    <div className={`rounded-xl p-2 ring-1 sm:p-2.5 ${toneClass}`}>
      <div className="text-[9px] font-medium uppercase tracking-wide opacity-70 sm:text-[10px]">{label}</div>
      <div className="mt-0.5 text-xs font-bold sm:text-sm">{value}</div>
    </div>
  );
}

function OrderRow({ num, name, total, status, tone }: { num: string; name: string; total: string; status: string; tone: "emerald" | "purple" | "blue" | "amber" }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "purple"
      ? "bg-purple-100 text-purple-700"
      : tone === "blue"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-white px-2.5 py-2 sm:gap-3 sm:px-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
        {name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-semibold text-foreground sm:text-xs">{name}</div>
        <div className="text-[10px] text-muted-foreground">{num}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[11px] font-bold text-foreground sm:text-xs">{total}</div>
        <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[8px] font-semibold sm:text-[9px] ${toneClass}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Trust bar ---------------- */
function TrustBar() {
  const { ref, inView } = useInView<HTMLDivElement>();
  // Targets are numeric; suffix ("+", "%", "★") is appended outside the count.
  const stats = [
    { value: 12000, suffix: "+", label: "Orders managed", decimals: 0 },
    { value: 850, suffix: "+", label: "Active sellers", decimals: 0 },
    { value: 98, suffix: "%", label: "WhatsApp delivery", decimals: 0 },
    { value: 4.9, suffix: "★", label: "Avg rating", decimals: 1 },
  ];
  return (
    <section className="border-y border-brand-100 bg-brand-50/40">
      <div
        ref={ref}
        className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-4"
      >
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-extrabold text-brand-gradient">
              <AnimatedNumber
                value={inView ? s.value : 0}
                duration={1200}
                format={(n) => {
                  const num =
                    s.decimals > 0
                      ? n.toFixed(s.decimals)
                      : Math.round(n).toLocaleString("en-PK");
                  return `${num}${s.suffix}`;
                }}
              />
            </div>
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Problem / Solution ---------------- */
function ProblemSolution({ onEnter }: { onEnter: () => void }) {
  const problems = [
    "Orders notebook ya Excel mein manually likhne se orders miss ho jate hain.",
    "Customer follow-up mushkil — kaunsa order kahan hai yaad nahi rehta.",
    "Delivery status confusing — kaunsa shipped, kaunsa pending.",
    "Payment record maintain karna mushkil — kis ne diya, kis ne nahi.",
  ];
  const solutions = [
    { icon: ClipboardList, title: "Ek click order entry", desc: "Customer aur items select karo, order ho gaya. Auto-saved." },
    { icon: MessageCircle, title: "Auto WhatsApp confirm", desc: "Order banate hi customer ko WhatsApp message jaata hai." },
    { icon: Wallet, title: "Payment tracking", desc: "JazzCash, EasyPaisa, COD — sab ek jagah track karo." },
    { icon: Bell, title: "Low stock + pending alerts", desc: "Jo items khatam hone wale hain, time pe alert." },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          The Problem
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
          Notebook aur Excel se orders barbaad ho rahe hain?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Chhote sellers abhi bhi orders ko manually likhte hain. Iska natija: ghalat entries,
          miss hoke orders, aur customers ka trust kam.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {problems.map((p) => (
          <div
            key={p}
            className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-4"
          >
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              ✕
            </span>
            <p className="text-sm font-medium text-foreground/80">{p}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          The Solution
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
          OrderNama — sab kuch ek jagah, mobile pe
        </h2>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {solutions.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="group border-brand-200/60 p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-600/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm transition group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Button size="lg" onClick={onEnter} className="bg-brand-gradient text-white hover:opacity-90">
          Try Kar Ke Dekhein <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */
function Features({ onEnter }: { onEnter: () => void }) {
  const features = [
    { icon: Smartphone, title: "Mobile-first design", desc: "Sellers zyada time mobile pe kaam karte hain — OrderNama har screen pe perfect." },
    { icon: MessageCircle, title: "WhatsApp automation", desc: "Order confirm, status change, ya delivery — har update pe auto WhatsApp message." },
    { icon: Wallet, title: "Local payment tracking", desc: "JazzCash, EasyPaisa, Bank transfer, aur Cash on Delivery — sab track karne ke liye." },
    { icon: Package, title: "Inventory basics", desc: "Item-wise stock count, low-stock alerts, aur top-selling items ki list." },
    { icon: BarChart3, title: "Sales analytics", desc: "Daily, weekly, monthly sales trends aur top-selling products ek nazar mein." },
    { icon: Users, title: "Customer history", desc: "Repeat customers ki pehchan, total spent, aur order history automatically." },
    { icon: Globe2, title: "Public order form", desc: "Apna unique form link share karein, customer khud order daale." },
    { icon: ShieldCheck, title: "Data export", desc: "Excel ya PDF mein orders ka backup lo kabhi bhi." },
  ];

  return (
    <section className="bg-brand-50/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Everything you need
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            A complete order management toolkit
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sirf order tracking pe focus — koi extra complexity nahi. Sirf woh features jo aapko
            waqt bachane aur orders grow karne mein madad karein.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="group border-brand-200/60 p-5 transition hover:border-brand-300 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" onClick={onEnter} variant="outline" className="border-brand-300 text-brand-700 hover:bg-brand-50">
            Demo Dekhein <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  const steps = [
    { num: "1", title: "Account banao", desc: "Phone number aur business name likho — bas." },
    { num: "2", title: "Orders enter karo", desc: "Manual entry ya order form link se — dono chalega." },
    { num: "3", title: "Customer ko confirm karo", desc: "Auto WhatsApp message chala jata hai." },
    { num: "4", title: "Status update karte jao", desc: "Pending → Confirmed → Shipped → Delivered." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          How it works
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
          4 simple steps, 2 minute mein start
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.num} className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-base font-extrabold text-white shadow-md">
                {s.num}
              </div>
              {i < steps.length - 1 && (
                <div className="hidden h-0.5 flex-1 bg-gradient-to-r from-brand-300 to-transparent md:block" />
              )}
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Product preview ---------------- */
function ProductPreview({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="bg-brand-gradient py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5" /> Live demo
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Abhi try karein — seedha browser mein
            </h2>
            <p className="mt-4 max-w-xl text-white/90">
              Humne ek demo boutique (Gulbahar Boutique) ke saath 48 orders, 10 customers, aur 8
              inventory items pehle se rakhe hain. Aap apne hisaab se filter karein, naya order
              bana kar dekhein, aur WhatsApp automation ka feel lein.
            </p>
            <Button
              size="lg"
              onClick={onEnter}
              className="mt-7 bg-white text-brand-800 hover:bg-white/90"
            >
              App Kholo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PreviewCard title="Today" value="12" sub="orders" tone="emerald" />
            <PreviewCard title="Revenue" value="Rs 28,500" sub="today" tone="brand" />
            <PreviewCard title="Customers" value="10" sub="active" tone="brand" />
            <PreviewCard title="Low stock" value="3" sub="items" tone="amber" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: "emerald" | "brand" | "amber" }) {
  // Deterministic width based on title to avoid SSR/client hydration mismatch
  const widths: Record<string, number> = { Revenue: 72, Orders: 58, Customers: 85, "Low stock": 33 };
  const pct = widths[title] ?? 60;
  return (
    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur ring-1 ring-white/20">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs text-white/70">{sub}</div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full ${
            tone === "emerald" ? "bg-emerald-300" : tone === "brand" ? "bg-white" : "bg-amber-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------- Testimonials ---------------- */
function Testimonials() {
  const items = [
    {
      name: "Hira Parveen",
      role: "Gulbahar Boutique, Karachi",
      quote:
        "Pehle Excel mein orders likhti thi, kaafi miss ho jate the. Ab OrderNama pe sab kuch ek jagah hai aur customer ko WhatsApp pe auto-confirm chala jata hai. Time 60% kam lagta hai.",
      rating: 5,
    },
    {
      name: "Ayesha Tariq",
      role: "@styles_by_aye, Lahore",
      quote:
        "Order form link apne Instagram pe laga diya. Ab customers khud order daalte hain, mujhe sirf confirm karna hai. Roman Urdu interface mere liye perfect.",
      rating: 5,
    },
    {
      name: "Sana Foods",
      role: "Home-based food business, Islamabad",
      quote:
        "Payment tracking best feature hai. JazzCash aur COD alag alag track hota hai, koi confusion nahi. Low stock alert se do baar orders bach gaye.",
      rating: 4,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          Sellers love it
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
          Real sellers, real feedback
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <Card key={t.name} className="border-brand-200/60 p-6">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">&quot;{t.quote}&quot;</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white ring-2 ring-brand-300 ring-offset-2 ring-offset-background">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */
export function Pricing({ onPickPlan }: { onPickPlan: () => void }) {
  const plans = [
    {
      name: "Free",
      price: "Rs 0",
      period: "/month",
      tagline: "Naye sellers ke liye perfect",
      features: ["30 orders / month", "1 user", "Basic order tracking", "Customer list", "Mobile app"],
      cta: "Shuru Karein",
      highlight: false,
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
        "Order form link",
        "Inventory basics",
        "Excel/PDF export",
      ],
      cta: "Pro Try Karein",
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
      cta: "Business Lein",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-brand-50/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Pricing</span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Simple plans, local rates
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Free tier generous rakhi hai taake har seller try kar sake. Jab grow karein, Pro pe
            upgrade karein.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`card-shine relative overflow-hidden p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-600/20 ${
                p.highlight
                  ? "border-brand-400 bg-white shadow-lg ring-2 ring-brand-400"
                  : "border-brand-200/60 bg-white"
              }`}
            >
              {p.highlight && (
                <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />
              )}
              {p.highlight && (
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
                onClick={onPickPlan}
                className={`mt-6 w-full ${
                  p.highlight
                    ? "bg-brand-gradient text-white hover:opacity-90"
                    : "border border-brand-300 text-brand-700 hover:bg-brand-50"
                }`}
                variant={p.highlight ? "default" : "outline"}
              >
                {p.cta}
              </Button>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans include local payment support (JazzCash / EasyPaisa / COD) · No setup fee ·
          Cancel anytime
        </p>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-20 text-white">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-lime-bright opacity-50 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Abhi free try karein. Orders miss karna band.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/90">
          30 second mein account banao, pehla order enter karo, aur customer ko WhatsApp pe
          confirm karo. No credit card needed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onEnter} className="bg-white text-brand-800 hover:bg-white/90">
            Free Shuru Karein <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-foreground">OrderNama</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Pakistan ke Instagram aur WhatsApp sellers ke liye order management tool. Simple,
              mobile-first, aur Roman Urdu support ke saath.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={["Features", "Pricing", "Demo", "Order Form"]}
          />
          <FooterCol
            title="Company"
            links={["About", "Contact", "Careers", "Blog"]}
          />
          <FooterCol
            title="Legal"
            links={["Terms of Service", "Privacy Policy", "WhatsApp Compliance", "Data Export"]}
          />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-100 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OrderNama. Pakistan ke liye, banaya gaya. 🌿
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-xs text-muted-foreground transition hover:text-brand-700">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
