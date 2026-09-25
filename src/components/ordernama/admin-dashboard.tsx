"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
  ShoppingBag,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

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

import { DonutChart } from "@/components/ordernama/svg-charts";
import { AnimatedNumber, AnimatedPKR } from "@/components/ordernama/animated-number";
import { api, formatNumber, formatPKR, timeAgo } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* --------------------------------- types --------------------------------- */

type AdminStats = {
  totalSellers: number;
  totalOrders: number;
  totalCustomers: number;
  totalStaff: number;
  openTickets: number;
  totalFormViews: number;
  totalRevenue: number;
  planDistribution: Record<string, number>;
  newThisMonth: number;
};

type AdminSeller = {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  city: string | null;
  plan: string;
  email: string | null;
  createdAt: string;
  orderCount: number;
  customerCount: number;
  inventoryCount: number;
  revenue: number;
  staffCount: number;
  ticketCount: number;
};

type SellersResponse = { sellers: AdminSeller[]; count: number };

/* -------------------------------- palette -------------------------------- */

const PLAN_DONUT_COLORS: Record<string, string> = {
  Free: "#78D23D",
  Pro: "#1E8C45",
  Business: "#007542",
};

const PLAN_BADGE: Record<string, string> = {
  Free: "bg-amber-100 text-amber-800 border-amber-200",
  Pro: "bg-brand-gradient text-white border-transparent",
  Business: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/* ------------------------------ helpers ------------------------------ */

function normalizePlan(plan: string): string {
  if (!plan) return "Free";
  const lower = plan.toLowerCase();
  if (lower === "pro") return "Pro";
  if (lower === "business") return "Business";
  return "Free";
}

function PlanBadge({ plan }: { plan: string }) {
  const key = normalizePlan(plan);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        PLAN_BADGE[key] || PLAN_BADGE.Free,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {key}
    </span>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border border-brand-200/60 p-4 sm:p-5 dark:border-brand-800/60">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </Card>
  );
}

function MiniStatSkeleton() {
  return (
    <Card className="border border-brand-200/60 p-4 dark:border-brand-800/60">
      <Skeleton className="h-7 w-7 rounded-lg" />
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-1 h-3 w-16" />
    </Card>
  );
}

/* ------------------------------- main ------------------------------- */

export function AdminDashboard() {
  const setView = useApp((s) => s.setView);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await api<AdminStats>("/api/admin/stats");
        if (!alive) return;
        setStats(s);
        // Staggered to avoid overwhelming the sandbox dev server.
        await delay(80);
        const r = await api<SellersResponse>(
          "/api/admin/sellers?status=&plan=&sort=newest",
        );
        if (!alive) return;
        setSellers(r.sellers || []);
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error ? e.message : "Failed to load admin dashboard",
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const planData = useMemo(() => {
    if (!stats) return [];
    const dist = stats.planDistribution || {};
    // Plans may arrive with any casing — normalize keys.
    const normalized: Record<string, number> = {};
    for (const [k, v] of Object.entries(dist)) {
      normalized[normalizePlan(k)] = (normalized[normalizePlan(k)] || 0) + v;
    }
    return (["Free", "Pro", "Business"] as const)
      .map((p) => ({
        label: p,
        value: normalized[p] || 0,
        color: PLAN_DONUT_COLORS[p],
      }))
      .filter((d) => d.value > 0);
  }, [stats]);

  const recentSellers = useMemo(() => {
    return [...sellers]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [sellers]);

  const kpiCards = [
    {
      label: "Total Sellers",
      numeric: stats?.totalSellers ?? 0,
      icon: Users,
      hint: `${stats?.newThisMonth ?? 0} new this month`,
    },
    {
      label: "Total Orders",
      numeric: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      hint: "Across all sellers",
    },
    {
      label: "Total Revenue",
      pkr: stats?.totalRevenue ?? 0,
      icon: Wallet,
      hint: "Paid + partial orders",
    },
    {
      label: "Open Tickets",
      numeric: stats?.openTickets ?? 0,
      icon: Ticket,
      hint: "Awaiting support",
    },
  ];

  if (error) {
    return (
      <div className="animate-fade-up rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <strong className="font-semibold">Error loading admin dashboard:</strong>{" "}
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-up sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide overview of every seller on OrderNama.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
          Platform view
        </span>
      </div>

      <Separator className="bg-brand-100/70 dark:bg-brand-800/40" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpiCards.map((c, idx) => (
              <Card
                key={c.label}
                className={cn(
                  "group border border-brand-200/60 p-4 transition hover-lift hover:shadow-md sm:p-5 dark:border-brand-800/60",
                  "animate-card-enter stagger-" + Math.min(idx + 1, 4),
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm ring-2 ring-brand-100 transition group-hover:scale-110 dark:ring-brand-900/40">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    Live
                  </span>
                </div>
                <div className="mt-4 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
                  {"pkr" in c ? (
                    <AnimatedPKR value={c.pkr ?? 0} />
                  ) : (
                    <AnimatedNumber
                      value={c.numeric ?? 0}
                      format={(n) => formatNumber(Math.round(n))}
                    />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{c.hint}</p>
              </Card>
            ))}
      </div>

      <Separator className="bg-brand-100/70 dark:bg-brand-800/40" />

      {/* Charts + recent sellers row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Sellers by plan */}
        <Card className="border border-brand-200/60 transition hover:shadow-md dark:border-brand-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              Sellers by Plan
            </CardTitle>
            <CardDescription>Distribution across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : planData.length === 0 ? (
              <div className="grid h-[200px] place-items-center text-sm text-muted-foreground">
                No sellers yet
              </div>
            ) : (
              <div className="flex justify-center py-2 text-foreground">
                <DonutChart data={planData} size={200} thickness={32} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent sellers */}
        <Card className="border border-brand-200/60 transition hover:shadow-md lg:col-span-2 dark:border-brand-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" />
              Recent Sellers
            </CardTitle>
            <CardDescription>
              The 5 most recently joined sellers on the platform
            </CardDescription>
            <CardAction>
              <Button
                variant="outline"
                size="sm"
                className="border-brand-200 text-brand-700 hover:bg-brand-50"
                onClick={() => setView("sellers")}
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
            ) : recentSellers.length === 0 ? (
              <div className="grid place-items-center py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Users className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium">No sellers yet</p>
                <p className="text-xs text-muted-foreground">
                  New sellers will appear here as they sign up
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-brand-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-50/60 hover:bg-brand-50/60">
                      <TableHead className="pl-3">Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="pr-3 text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSellers.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-brand-50/40"
                        onClick={() => setView("sellers")}
                      >
                        <TableCell className="py-2.5 pl-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {s.businessName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {s.city || "—"} · {timeAgo(s.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="text-sm">{s.ownerName}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <PlanBadge plan={s.plan} />
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-sm tabular-nums">
                          {formatNumber(s.orderCount)}
                        </TableCell>
                        <TableCell className="py-2.5 pr-3 text-right text-sm font-semibold tabular-nums">
                          {formatPKR(s.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-100/70 dark:bg-brand-800/40" />

      {/* Platform health mini-stats */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Platform Health
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <MiniStatSkeleton key={i} />
            ))
          ) : (
            <>
              <Card className="group border border-brand-200/60 p-4 transition hover-lift hover:shadow-md sm:p-5 dark:border-brand-800/60">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="mt-3 text-2xl font-extrabold tabular-nums">
                  <AnimatedNumber
                    value={stats?.newThisMonth ?? 0}
                    format={(n) => formatNumber(Math.round(n))}
                  />
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  New sellers this month
                </p>
              </Card>

              <Card className="group border border-brand-200/60 p-4 transition hover-lift hover:shadow-md sm:p-5 dark:border-brand-800/60">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Users className="h-5 w-5" />
                </div>
                <div className="mt-3 text-2xl font-extrabold tabular-nums">
                  <AnimatedNumber
                    value={stats?.totalStaff ?? 0}
                    format={(n) => formatNumber(Math.round(n))}
                  />
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total staff accounts
                </p>
              </Card>

              <Card className="group border border-brand-200/60 p-4 transition hover-lift hover:shadow-md sm:p-5 dark:border-brand-800/60">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="mt-3 text-2xl font-extrabold tabular-nums">
                  <AnimatedNumber
                    value={stats?.totalFormViews ?? 0}
                    format={(n) => formatNumber(Math.round(n))}
                  />
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total form views
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
