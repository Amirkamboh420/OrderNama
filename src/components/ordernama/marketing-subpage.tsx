"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, CheckCircle2, Mail, MessageCircle, Package, ShieldCheck, Smartphone, Users, Wallet, Zap } from "lucide-react";
import { MarketingHeader } from "@/components/shell/marketing-header";
import { AuthScreen } from "@/components/ordernama/auth-screen";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

type PageKind = "features" | "pricing" | "demo" | "contact";

const pageCopy: Record<PageKind, { eyebrow: string; title: string; description: string }> = {
  features: { eyebrow: "OrderNama features", title: "Har order, ek simple system mein.", description: "Orders, customers, stock aur payments ko ek jagah manage karein. OrderNama Pakistani online sellers ke roz ke kaam ke liye bana hai." },
  pricing: { eyebrow: "Simple pricing", title: "Apne business ke hisaab se plan chunein.", description: "Free se shuru karein aur business grow hone par plan upgrade karein. Local payments aur order workflow ko samajhne mein koi setup fee nahi." },
  demo: { eyebrow: "Live product demo", title: "OrderNama ko khud explore karein.", description: "Demo dashboard khol kar orders, inventory, customer records aur analytics ka workflow dekhein." },
  contact: { eyebrow: "Contact OrderNama", title: "Hum aapki madad ke liye yahan hain.", description: "Setup, plans ya product ke baare mein sawal ho? Support team ko email bhejein; hum aapko sahi direction denge." },
};

const features = [
  { icon: Smartphone, title: "Mobile-friendly orders", text: "Phone ya desktop se orders enter karein aur unka status ek nazar mein dekhein." },
  { icon: MessageCircle, title: "WhatsApp workflow", text: "Order confirmations aur status updates ke liye WhatsApp tools use karein." },
  { icon: Wallet, title: "Payment tracking", text: "COD, JazzCash, EasyPaisa aur bank transfer payments ko order ke saath record karein." },
  { icon: Package, title: "Inventory overview", text: "Products ka stock track karein aur low-stock items ko waqt par pehchanein." },
  { icon: BarChart3, title: "Sales analytics", text: "Sales aur order activity ke trends dashboard par review karein." },
  { icon: Users, title: "Customer history", text: "Customer contact details aur unke pichhle orders ko ek jagah rakhein." },
  { icon: ShieldCheck, title: "Team permissions", text: "Staff ko role aur permissions ke mutabiq kaam tak access dein." },
  { icon: Zap, title: "Public order form", text: "Shareable order form se customers se order details collect karein." },
];

const plans = [
  { name: "Free", price: "Rs 0", note: "Naye sellers ke liye", features: ["30 orders / month", "1 user", "Order tracking", "Customer list"] },
  { name: "Pro", price: "Rs 1,200", note: "Growing businesses ke liye", features: ["Unlimited orders", "WhatsApp automation", "Sales analytics", "Order form and inventory"], popular: true },
  { name: "Business", price: "Rs 3,500", note: "Teams aur scale ke liye", features: ["Pro ke tamam features", "Staff access", "Multi-store support", "Priority support"] },
];

export function MarketingSubpage({ page }: { page: PageKind }) {
  const router = useRouter();
  const enterApp = useApp((state) => state.enterApp);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

  if (authMode) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onBack={() => setAuthMode(null)} />;

  const copy = pageCopy[page];
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader onLogin={() => setAuthMode("login")} onRegister={() => setAuthMode("register")} />
      <main>
        <section className="bg-brand-gradient px-6 py-16 text-white sm:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{copy.eyebrow}</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl">{copy.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{copy.description}</p>
            {page === "demo" && <Button onClick={() => { enterApp(); router.push("/"); }} size="lg" className="mt-8 bg-white text-brand-800 hover:bg-white/90">Demo dashboard kholein <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {page === "features" && <Button onClick={() => setAuthMode("register")} size="lg" className="mt-8 bg-white text-brand-800 hover:bg-white/90">Free shuru karein <ArrowRight className="ml-2 h-4 w-4" /></Button>}
          </div>
        </section>

        {page === "features" && <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span><h2 className="mt-4 font-bold text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
        </section>}

        {page === "pricing" && <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`relative rounded-2xl border bg-white p-7 shadow-sm ${plan.popular ? "border-brand-400 ring-2 ring-brand-300" : "border-brand-100"}`}>
          {plan.popular && <span className="absolute right-5 top-5 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-white">POPULAR</span>}
          <h2 className="text-xl font-bold">{plan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{plan.note}</p><p className="mt-6 text-3xl font-extrabold">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span></p>
          <ul className="mt-6 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{feature}</li>)}</ul>
          <Button onClick={() => setAuthMode("register")} className={`mt-8 w-full ${plan.popular ? "bg-brand-gradient text-white" : "border-brand-300 text-brand-700"}`} variant={plan.popular ? "default" : "outline"}>Plan shuru karein</Button>
        </article>)}</section>}

        {page === "demo" && <section className="mx-auto max-w-5xl px-6 py-16"><div className="grid gap-5 sm:grid-cols-3">{[["Orders", "48", "Orders in demo store"], ["Customers", "10", "Customer profiles"], ["Inventory", "8", "Products to explore"]].map(([label, value, caption]) => <div key={label} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-center"><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-4xl font-extrabold text-brand-700">{value}</p><p className="mt-1 text-sm text-muted-foreground">{caption}</p></div>)}</div><p className="mt-8 text-center text-sm text-muted-foreground">Demo workspace mein sample store data diya gaya hai. Dashboard khol kar views aur workflows explore karein.</p></section>}

        {page === "contact" && <section className="mx-auto max-w-4xl px-6 py-16"><div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-8 text-center sm:p-12"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white"><Mail className="h-6 w-6" /></span><h2 className="mt-5 text-2xl font-bold">Email support</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Apna sawal ya issue detail ke saath bhejein. Email app khol kar support team ko message likhein.</p><a href="mailto:support@ordernama.com" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90">support@ordernama.com <ArrowRight className="h-4 w-4" /></a></div></section>}
      </main>
      <footer className="border-t border-brand-100 px-6 py-6 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} OrderNama · Pakistan ke online sellers ke liye</footer>
    </div>
  );
}
