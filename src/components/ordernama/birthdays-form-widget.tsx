"use client";

import { useEffect, useState } from "react";
import { Gift, Calendar, ExternalLink, TrendingUp, Eye, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, formatPKR } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================ Birthdays Widget ============================ */

type BirthdayCustomer = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  birthdayDay: number;
  daysUntil: number;
  isToday: boolean;
  isUpcoming: boolean;
  tags: string;
  totalOrders: number;
  totalSpent: number;
};

export function BirthdaysWidget() {
  const [customers, setCustomers] = useState<BirthdayCustomer[]>([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 200)); // small delay to reduce server pressure
        const d = await api<{ customers: BirthdayCustomer[]; month: string }>("/api/customers/birthdays");
        if (!active) return;
        setCustomers(d.customers || []);
        setMonth(d.month || "");
      } catch {
        /* swallowed */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const today = customers.filter((c) => c.isToday);
  const upcoming = customers.filter((c) => c.isUpcoming);
  const past = customers.filter((c) => !c.isToday && !c.isUpcoming);

  return (
    <Card className="border border-brand-200/60 p-4 transition hover:shadow-md sm:p-5">
      <CardTitle className="flex items-center gap-2 text-base font-bold leading-tight">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
          <Gift className="h-4 w-4" />
        </span>
        Birthdays — {month}
      </CardTitle>
      <CardDescription className="mt-1 text-xs">
        {customers.length} customer{customers.length !== 1 ? "s" : ""} celebrating this month
      </CardDescription>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="grid place-items-center py-6 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-medium">Koi birthday nahi is month</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-brand pr-1">
            {today.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 px-1">Today 🎉</p>
            )}
            {today.map((c) => (
              <BirthdayRow key={c.id} c={c} highlight />
            ))}
            {upcoming.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-1">Upcoming</p>
            )}
            {upcoming.map((c) => (
              <BirthdayRow key={c.id} c={c} />
            ))}
            {past.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 pt-1">Past</p>
            )}
            {past.map((c) => (
              <BirthdayRow key={c.id} c={c} faded />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function BirthdayRow({ c, highlight, faded }: { c: BirthdayCustomer; highlight?: boolean; faded?: boolean }) {
  const waText = encodeURIComponent(`Happy Birthday ${c.name}! 🎂 Wishing you a wonderful day. Special discount available for you at our boutique!`);
  return (
    <a
      href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}?text=${waText}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition hover:bg-brand-50/60",
        highlight ? "border-rose-200 bg-rose-50/40" : "border-brand-100/60",
        faded && "opacity-60",
      )}
    >
      <span className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
        highlight ? "bg-rose-100 text-rose-700" : "bg-brand-50 text-brand-700",
      )}>
        {c.birthdayDay}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{c.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {c.isToday ? "🎉 Today!" : c.daysUntil === 1 ? "Tomorrow" : c.daysUntil > 0 ? `In ${c.daysUntil} days` : `${Math.abs(c.daysUntil)}d ago`}
          {c.totalOrders > 0 && ` · ${c.totalOrders} order${c.totalOrders > 1 ? "s" : ""}`}
        </div>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  );
}

/* ======================= Form Analytics Widget =========================== */

type FormAnalytics = {
  totalViews: number;
  bySource: Record<string, number>;
  series: { date: string; label: string; views: number }[];
  conversionRate: number;
  formOrders: number;
};

export function FormAnalyticsWidget() {
  const setView = useApp((s) => s.setView);
  const [data, setData] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 300)); // stagger with other fetches
        const d = await api<FormAnalytics>("/api/form-analytics");
        if (!active) return;
        setData(d);
      } catch {
        /* swallowed */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const maxViews = data ? Math.max(...data.series.map((s) => s.views), 1) : 1;

  return (
    <Card className="border border-brand-200/60 p-4 transition hover:shadow-md sm:p-5">
      <CardTitle className="flex items-center gap-2 text-base font-bold leading-tight">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Eye className="h-4 w-4" />
        </span>
        Order Form Analytics
      </CardTitle>
      <CardDescription className="mt-1 text-xs">
        Form views + conversion rate
      </CardDescription>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : !data ? (
          <div className="grid place-items-center py-6 text-center text-xs text-muted-foreground">
            No form analytics yet
          </div>
        ) : (
          <>
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-brand-50/60 p-2 text-center">
                <div className="text-lg font-extrabold text-brand-700">{data.totalViews}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Views</div>
              </div>
              <div className="rounded-lg bg-emerald-50/60 p-2 text-center">
                <div className="text-lg font-extrabold text-emerald-700">{data.formOrders}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Orders</div>
              </div>
              <div className="rounded-lg bg-amber-50/60 p-2 text-center">
                <div className="text-lg font-extrabold text-amber-700">{data.conversionRate}%</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Conv.</div>
              </div>
            </div>

            {/* 14-day mini bar chart */}
            <div className="mt-3">
              <div className="flex items-end gap-0.5 h-16">
                {data.series.map((s, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-brand-gradient opacity-70 hover:opacity-100 transition"
                    style={{ height: `${(s.views / maxViews) * 100}%`, minHeight: "2px" }}
                    title={`${s.label}: ${s.views} views`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                <span>{data.series[0]?.label}</span>
                <span>{data.series[data.series.length - 1]?.label}</span>
              </div>
            </div>

            {/* Source breakdown */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(data.bySource).map(([source, count]) => (
                <Badge key={source} variant="secondary" className="text-[10px]">
                  {source}: {count}
                </Badge>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs text-brand-700 hover:bg-brand-50"
              onClick={() => setView("settings")}
            >
              <MousePointerClick className="h-3 w-3" />
              Manage form link
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
