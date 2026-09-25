"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart as SvgAreaChart,
  BarChart as SvgBarChart,
} from "@/components/ordernama/svg-charts";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Circle,
  Clock,
  MessageCircle,
  Package,
  PackageCheck,
  PackageX,
  PartyPopper,
  Plus,
  Settings,
  Share2,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { api, formatPKR, timeAgo } from "@/lib/api";
import { PayBadge, StatusBadge } from "@/components/ordernama/badges";
import { AnimatedNumber, AnimatedPKR } from "@/components/ordernama/animated-number";
import { MonthlyGoalWidget } from "@/components/ordernama/monthly-goal-widget";
import { CustomerSegmentsWidget } from "@/components/ordernama/customer-segments-widget";
import { BirthdaysWidget, FormAnalyticsWidget } from "@/components/ordernama/birthdays-form-widget";
import { OnboardingChecklist, ActivityFeed } from "@/components/ordernama/dashboard-widgets";
import type { Seller, SettingPayload, Stats, ActivityItem, ActivityTone } from "@/components/ordernama/dashboard-widgets";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ---------------------------------- types ---------------------------------- */

type Range = "today" | "7d" | "30d" | "all";

// Seller, SettingPayload, Stats, ActivityItem, ActivityTone are imported from
// ./dashboard-widgets to avoid duplication. We extend Stats locally with the
// Range type since the widgets file uses a looser `range?: string`.
type DashboardStats = Stats & { range?: Range };

type Analytics = {
  series: { date: string; label: string; revenue: number; orders: number }[];
  byStatus: Record<string, { count: number; revenue: number }>;
  byMethod: Record<string, number>;
  topItems: { name: string; qty: number; revenue: number }[];
  repeatCustomers: number;
  momGrowth: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string; city: string | null };
};

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  lowStockAt: number;
  price: number;
};

type SettingsResponse = {
  seller: Seller;
  setting: SettingPayload | null;
};

type ActivityResponse = {
  activities: ActivityItem[];
  counts: { whatsapp: number; orders: number };
};

/* --------------------------------- palette --------------------------------- */

const BRAND_PRIMARY = "#1E8C45";
const BRAND_SECONDARY = "#78D23D";

const STATUS_BAR_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Shipped: "#a855f7",
  Delivered: "#1E8C45",
  Cancelled: "#f43f5e",
};

/* ------------------------------- sub-components ---------------------------- */

function Sparkline({ values, stroke = BRAND_PRIMARY }: { values: number[]; stroke?: string }) {
  const data = values.length ? values : [0, 0];
  const w = 88;
  const h = 26;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const linePoints = pts.join(" ");
  // Closed polygon for the faint gradient fill below the line (baseline = h)
  const fillPoints = `${linePoints} ${((data.length - 1) * step).toFixed(2)},${h} 0,${h}`;
  const gradId = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gradId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendPill({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
        up ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
    </span>
  );
}

/* --------------------------- timeframe segmented --------------------------- */

const TIMEFRAME_OPTIONS: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

function TimeframeControl({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-card"
      role="group"
      aria-label="Dashboard timeframe"
    >
      {TIMEFRAME_OPTIONS.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              active
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-muted-foreground hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </Card>
  );
}

/* --------------------------------- main ------------------------------------ */

export function Dashboard() {
  const setView = useApp((s) => s.setView);
  const fireNewOrder = useApp((s) => s.fireNewOrder);
  const [timeframe, setTimeframe] = useState<Range>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [setting, setSetting] = useState<SettingPayload | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityCounts, setActivityCounts] = useState<{ whatsapp: number; orders: number }>({
    whatsapp: 0,
    orders: 0,
  });
  const [extrasLoading, setExtrasLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      setLoading(true);
      setError(null);
      // NOTE: We fetch sequentially with small delays between each call to
      // avoid overwhelming the sandbox dev server which has a strict memory
      // limit. The total adds ~350ms but prevents OOM crashes.
      try {
        const s = await api<DashboardStats>(`/api/stats?range=${timeframe}`);
        if (!active) return;
        setStats(s);
        await delay(80);
        const a = await api<Analytics>(`/api/analytics?range=${timeframe}`);
        if (!active) return;
        setAnalytics(a);
        await delay(80);
        const o = await api<{ orders: RecentOrder[] }>(`/api/orders?limit=6&range=${timeframe}`);
        if (!active) return;
        setRecentOrders(o.orders || []);
        await delay(80);
        const l = await api<{ items: InventoryItem[] }>("/api/inventory?filter=low");
        if (!active) return;
        setLowStock(l.items || []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }

      // Secondary, non-blocking fetch for onboarding checklist + recent activity feed.
      // Also staggered with delays. Failures are swallowed.
      try {
        await delay(100);
        const sel = await api<Seller>("/api/seller");
        if (!active) return;
        setSeller(sel);
        await delay(80);
        const st = await api<SettingsResponse>("/api/settings");
        if (!active) return;
        setSetting(st.setting);
        await delay(80);
        const act = await api<ActivityResponse>("/api/activity");
        if (!active) return;
        setActivities(act.activities || []);
        setActivityCounts(act.counts || { whatsapp: 0, orders: 0 });
      } catch {
        /* swallowed — widgets show empty states */
      } finally {
        if (active) setExtrasLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [timeframe]);

  const revenueSeries = analytics?.series ?? [];
  // For KPI sparklines we always use the most recent 7 buckets of the visible range
  const sparkRev = revenueSeries.slice(-7).map((p) => p.revenue);
  const sparkOrders = revenueSeries.slice(-7).map((p) => p.orders);
  const momGrowth = analytics?.momGrowth ?? 0;

  const statusBreakdown = useMemo(() => {
    if (!analytics?.byStatus) return [];
    return Object.entries(analytics.byStatus).map(([k, v]) => ({
      status: k,
      count: v.count,
      revenue: v.revenue,
    }));
  }, [analytics]);

  // Revenue chart title + X-axis interval based on selected timeframe
  const revenueChartTitle =
    timeframe === "today"
      ? "Revenue (today, hourly)"
      : timeframe === "7d"
        ? "Revenue (last 7 days)"
        : timeframe === "all"
          ? "Revenue (last 30 days)"
          : "Revenue (last 30 days)";
  const revenueChartSubtitle =
    timeframe === "today"
      ? "Hourly revenue from paid & partial orders"
      : "Daily revenue from paid & partial orders";
  const xAxisInterval =
    timeframe === "today" ? 1 : timeframe === "7d" ? 0 : 2;

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <strong className="font-semibold">Error loading dashboard:</strong> {error}
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Orders",
      numeric: stats?.todayOrders ?? 0,
      icon: ShoppingBag,
      spark: sparkOrders,
      trend: momGrowth,
      stroke: BRAND_PRIMARY,
    },
    {
      label: "Revenue",
      pkr: stats?.rangeRevenue ?? stats?.monthRevenue ?? 0,
      icon: TrendingUp,
      spark: sparkRev,
      trend: momGrowth,
      stroke: "#3AA346",
    },
    {
      label: "Pending Orders",
      numeric: stats?.pendingOrders ?? 0,
      icon: Clock,
      spark: [],
      trend: 0,
      stroke: "#f59e0b",
    },
    {
      label: "Low Stock",
      numeric: stats?.lowStockCount ?? 0,
      icon: PackageX,
      spark: [],
      trend: 0,
      stroke: "#f43f5e",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base dark:text-muted-foreground">
            Welcome back — here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TimeframeControl value={timeframe} onChange={setTimeframe} />
          {stats && (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/60">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              {stats.plan} plan
            </span>
          )}
        </div>
      </div>

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((c, idx) => (
              <Card
                key={c.label}
                className={`group gap-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 dark:border-slate-800 animate-card-enter stagger-${Math.min(idx + 1, 4)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-muted-foreground">{c.label}</span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:scale-105 dark:bg-brand-900/30 dark:ring-brand-800/50">
                    <c.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl dark:text-foreground">
                      {"pkr" in c ? <AnimatedPKR value={c.pkr ?? 0} /> : <AnimatedNumber value={c.numeric ?? 0} />}
                    </div>
                    {c.trend !== 0 && c.spark.length > 0 && <div className="mt-2"><TrendPill value={c.trend} /></div>}
                  </div>
                  {c.spark.length > 0 && <Sparkline values={c.spark} stroke={c.stroke} />}
                </div>
              </Card>
            ))}
      </div>

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Revenue area */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              {revenueChartTitle}
            </CardTitle>
            <CardDescription>{revenueChartSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : revenueSeries.length === 0 ? (
              <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
                No revenue data yet
              </div>
            ) : (
              <SvgAreaChart
                data={revenueSeries.map((p) => ({ label: p.label, value: p.revenue }))}
                height={260}
                color={BRAND_PRIMARY}
                formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)))}
                interval={xAxisInterval}
              />
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-brand-600" />
              Orders by Status
            </CardTitle>
            <CardDescription>Current pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : statusBreakdown.length === 0 ? (
              <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <SvgBarChart
                data={statusBreakdown.map((s) => ({
                  label: s.status,
                  value: s.count,
                  color: STATUS_BAR_COLORS[s.status] || BRAND_SECONDARY,
                }))}
                height={260}
                layout="horizontal"
                formatValue={(v) => String(Math.round(v))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-slate-200 dark:bg-slate-800" />

      {/* Recent Orders + side column */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              Recent Orders
            </CardTitle>
            <CardDescription>
              Latest 6 orders · {TIMEFRAME_OPTIONS.find((o) => o.key === timeframe)?.label.toLowerCase()} view
            </CardDescription>
            <CardAction>
              <Button
                variant="outline"
                size="sm"
                className="border-brand-200 text-brand-700 hover:bg-brand-50"
                onClick={() => setView("orders")}
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="grid place-items-center py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium">No orders yet</p>
                <p className="text-xs text-muted-foreground">
                  Orders will appear here as soon as they&apos;re placed
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-brand-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-50/60 hover:bg-brand-50/60">
                      <TableHead className="pl-3">Customer</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="pr-3 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer"
                        onClick={() => setView("orders")}
                      >
                        <TableCell className="py-2.5 pl-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{o.customer.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {o.customer.city || o.customer.phone} · {timeAgo(o.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs text-brand-700">{o.orderNumber}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <PayBadge status={o.paymentStatus} />
                        </TableCell>
                        <TableCell className="py-2.5 pr-3 text-right font-semibold tabular-nums">
                          {formatPKR(o.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side column: Monthly Goal + Birthdays + Form Analytics + Segments + Low Stock + Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Monthly Goal widget */}
          <MonthlyGoalWidget />

          {/* Birthdays this month */}
          <BirthdaysWidget />

          {/* Form analytics */}
          <FormAnalyticsWidget />

          {/* Customer Segments widget */}
          <CustomerSegmentsWidget />

          {/* Low stock alerts */}
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <PackageX className="h-4 w-4 text-amber-600" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Items at or below threshold</CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-700 hover:bg-brand-50"
                  onClick={() => setView("inventory")}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : lowStock.length === 0 ? (
                <div className="grid place-items-center py-8 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-sm font-medium">All stocked up</p>
                  <p className="text-xs text-muted-foreground">No items below threshold</p>
                </div>
              ) : (
                <div className="scrollbar-brand max-h-80 space-y-1.5 overflow-y-auto pr-1">
                  {lowStock.map((it) => {
                    const out = it.stock === 0;
                    return (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-brand-100/60 bg-brand-50/30 px-3 py-2 transition hover:bg-brand-50/60"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{it.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {it.sku ? `SKU ${it.sku} · ` : ""}
                            stock {it.stock}/{it.lowStockAt}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            out ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800",
                          )}
                        >
                          {out ? "Out" : "Low"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 shadow-sm transition hover:shadow-md dark:border-brand-900 dark:from-card dark:to-brand-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-700" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump straight to a common task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full bg-brand-gradient text-white hover:opacity-90"
                onClick={() => {
                  fireNewOrder();
                  setView("orders");
                }}
              >
                <Plus className="h-4 w-4" />
                New Order
              </Button>
              <Button
                variant="outline"
                className="w-full border-brand-200 text-brand-700 hover:bg-brand-50"
                onClick={() => setView("customers")}
              >
                <Users className="h-4 w-4" />
                View Customers
              </Button>
              <Button
                variant="outline"
                className="w-full border-brand-200 text-brand-700 hover:bg-brand-50"
                onClick={() => setView("inventory")}
              >
                <Boxes className="h-4 w-4" />
                Add Inventory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="bg-brand-100/70 dark:bg-brand-800/40" />

      {/* Onboarding checklist + Recent activity */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <OnboardingChecklist
          seller={seller}
          setting={setting}
          stats={stats}
          loading={extrasLoading}
          setView={setView}
        />
        <ActivityFeed
          activities={activities}
          counts={activityCounts}
          loading={extrasLoading}
        />
      </div>
    </div>
  );
}
