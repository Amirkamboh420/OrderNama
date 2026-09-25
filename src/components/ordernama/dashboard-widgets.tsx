"use client";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Circle,
  PartyPopper,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/api";
import { Confetti } from "@/components/ordernama/confetti";

/* --------------------------------- types ---------------------------------- */

export type Seller = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  city: string | null;
  plan: string;
  currency: string;
  romanUrdu: boolean;
};

export type SettingPayload = {
  autoConfirm: boolean;
  autoStatusUpdate: boolean;
  lowStockAlert: boolean;
  orderFormSlug: string | null;
  brandColor: string;
  monthlyGoal: number;
};

export type Stats = {
  orders: number;
  customers: number;
  inventory: number;
  whatsappLogs: number;
  todayOrders: number;
  monthOrders: number;
  pendingOrders: number;
  unpaidOrders: number;
  lowStockCount: number;
  totalRevenue: number;
  monthRevenue: number;
  rangeRevenue?: number;
  range?: string;
  plan: string;
};

export type ActivityTone = "brand" | "emerald" | "amber" | "blue" | "purple" | "rose";

export type ActivityItem = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: string;
  tone: ActivityTone;
};

type OnboardingItem = {
  key: string;
  label: string;
  desc: string;
  done: boolean;
  actionLabel: string;
  onAction: () => void;
};

type ViewKey =
  | "orders"
  | "inventory"
  | "settings"
  | "customers"
  | "analytics"
  | "pricing"
  | "notifications"
  | "dashboard"
  | "landing";

/* --------------------------- onboarding checklist -------------------------- */

export function OnboardingChecklist({
  seller,
  setting,
  stats,
  loading,
  setView,
}: {
  seller: Seller | null;
  setting: SettingPayload | null;
  stats: Stats | null;
  loading: boolean;
  setView: (v: ViewKey) => void;
}) {
  const items: OnboardingItem[] = [
    {
      key: "profile",
      label: "Business profile",
      desc: "City aur WhatsApp number add karein",
      done: Boolean(seller?.city && seller?.whatsappNumber),
      actionLabel: "Edit",
      onAction: () => setView("settings"),
    },
    {
      key: "inventory",
      label: "Add first inventory item",
      desc: "Apna pehla product add karein",
      done: Boolean(stats && stats.inventory > 0),
      actionLabel: "Add",
      onAction: () => setView("inventory"),
    },
    {
      key: "order",
      label: "Create first order",
      desc: "Pehla order create karein",
      done: Boolean(stats && stats.orders > 0),
      actionLabel: "New",
      onAction: () => setView("orders"),
    },
    {
      key: "whatsapp",
      label: "Enable WhatsApp automation",
      desc: "Auto-confirm messages on karein",
      done: Boolean(setting && setting.autoConfirm === true),
      actionLabel: "Enable",
      onAction: () => setView("settings"),
    },
    {
      key: "orderform",
      label: "Share your order form",
      desc: "Order form slug set karein",
      done: Boolean(setting && setting.orderFormSlug && setting.orderFormSlug.trim() !== ""),
      actionLabel: "Setup",
      onAction: () => setView("settings"),
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;

  return (
    <Card className="border border-brand-200/60 p-4 transition hover:shadow-md sm:p-5">
      <CardTitle className="flex items-center gap-2 text-base font-bold leading-tight">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Store className="h-4 w-4" />
        </span>
        Apna setup mukammal karein
      </CardTitle>
      <CardDescription className="mt-1 text-xs">
        5 steps to get your store fully running
      </CardDescription>

      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-2 w-full rounded-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : allDone ? (
          <div className="rounded-xl border border-brand-200 bg-brand-gradient-soft p-5 text-center">
            <Confetti show />
            <PartyPopper className="mx-auto h-8 w-8 text-brand-600" />
            <p className="mt-2 text-sm font-bold text-brand-700">
              🎉 Setup complete! Aap ready hain.
            </p>
            <div className="mt-2 text-xl tracking-widest">🎊 🥳 🎈</div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  {completed}/{total} complete
                </span>
                <span className="font-semibold text-brand-700">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-brand-gradient h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-0.5">
              {items.map((it) => (
                <div
                  key={it.key}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-brand-50/40",
                    it.done && "opacity-90",
                  )}
                >
                  {it.done ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-brand-300">
                      <Circle className="h-2.5 w-2.5 text-brand-300" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{it.label}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {it.desc}
                      </div>
                    </div>
                    {!it.done && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-brand-200 px-2 text-xs text-brand-700 hover:bg-brand-50"
                        onClick={it.onAction}
                      >
                        {it.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ activity feed ------------------------------ */

const ACTIVITY_TONE: Record<ActivityTone, string> = {
  brand: "bg-brand-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  rose: "bg-rose-500",
};

export function ActivityFeed({
  activities,
  counts,
  loading,
}: {
  activities: ActivityItem[];
  counts: { whatsapp: number; orders: number };
  loading: boolean;
}) {
  const total = activities.length;
  return (
    <Card className="border border-brand-200/60 p-4 transition hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base font-bold leading-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <Activity className="h-4 w-4" />
          </span>
          Recent Activity
        </CardTitle>
        <Badge className="bg-brand-50 text-brand-700" variant="secondary">
          {total}
        </Badge>
      </div>
      <CardDescription className="mt-1 text-xs">
        {counts.whatsapp} WhatsApp · {counts.orders} orders
      </CardDescription>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Activity className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium">Abhi koi activity nahi</p>
            <p className="text-xs text-muted-foreground">
              Recent events will show up here
            </p>
          </div>
        ) : (
          <div className="activity-rail scrollbar-brand max-h-96 space-y-3 overflow-y-auto pr-1">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 pl-1">
                <span
                  className={cn(
                    "mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-card",
                    ACTIVITY_TONE[a.tone] || "bg-brand-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">{a.title}</div>
                  {a.detail && (
                    <div className="text-xs leading-snug text-muted-foreground">
                      {a.detail}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {timeAgo(a.at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
