"use client";

import * as React from "react";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  Eye,
  MousePointerClick,
} from "lucide-react";
import {
  ComposedChart as SvgComposedChart,
  BarChart as SvgBarChart,
  DonutChart as SvgDonutChart,
} from "@/components/ordernama/svg-charts";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { api, formatPKR, formatNumber } from "@/lib/api";

const SERIES_COLORS = ["#007542", "#1E8C45", "#3AA346", "#58BB43", "#78D23D", "#9BE931", "#C1FF1C"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Confirmed: "#3AA346",
  Shipped: "#8b5cf6",
  Delivered: "#007542",
  Cancelled: "#ef4444",
};
const METHOD_COLORS: Record<string, string> = {
  COD: "#1E8C45",
  JazzCash: "#ef4444",
  EasyPaisa: "#0ea5e9",
  Bank: "#f59e0b",
  Other: "#78716c",
};

type Stats = {
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
  plan: string;
};

type Analytics = {
  series: Array<{ date: string; label: string; revenue: number; orders: number }>;
  byStatus: Record<string, { count: number; revenue: number }>;
  byMethod: Record<string, number>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  repeatCustomers: number;
  momGrowth: number;
};

type FormAnalytics = {
  totalViews: number;
  bySource: Record<string, number>;
  series: { date: string; label: string; views: number }[];
  conversionRate: number;
  formOrders: number;
};

export function AnalyticsView() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [formData, setFormData] = React.useState<FormAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api<Stats>("/api/stats"),
      api<Analytics>("/api/analytics"),
    ])
      .then(([s, a]) => {
        if (!alive) return;
        setStats(s);
        setAnalytics(a);
      })
      .catch((e) => toast.error("Failed to load analytics", { description: String(e) }))
      .finally(() => alive && setLoading(false));

    // Secondary non-blocking fetch for form analytics
    api<FormAnalytics>("/api/form-analytics")
      .then((d) => { if (alive) setFormData(d); })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !stats || !analytics) {
    return <AnalyticsSkeleton />;
  }

  const statusRows = Object.entries(analytics.byStatus).map(([name, v]) => ({
    name,
    count: v.count,
    revenue: v.revenue,
  }));
  const methodRows = Object.entries(analytics.byMethod).map(([name, value]) => ({
    name,
    value,
  }));
  const maxQty = Math.max(...analytics.topItems.map((t) => t.qty || 0), 1);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HeaderKpi
          icon={<ShoppingBag className="h-5 w-5" />}
          label="This Month Orders"
          value={formatNumber(stats.monthOrders)}
          tone="brand"
        />
        <HeaderKpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="MoM Growth"
          value={`${analytics.momGrowth >= 0 ? "+" : ""}${analytics.momGrowth}%`}
          tone={analytics.momGrowth >= 0 ? "brand" : "rose"}
        />
        <HeaderKpi
          icon={<Users className="h-5 w-5" />}
          label="Repeat Customers"
          value={formatNumber(analytics.repeatCustomers)}
          tone="brand"
        />
        <HeaderKpi
          icon={<Wallet className="h-5 w-5" />}
          label="Total Revenue"
          value={formatPKR(stats.totalRevenue)}
          tone="brand"
        />
      </div>

      {/* Revenue vs Orders combo chart */}
      <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
        <ChartHeader
          title="Revenue vs Orders"
          subtitle="Last 14 days · bars = orders, line = revenue (PKR)"
        />
        <div className="h-[260px] w-full mt-3">
          <SvgComposedChart
            data={analytics.series.map((p) => ({ label: p.label, bar: p.orders, line: p.revenue }))}
            height={260}
            barColor="#78D23D"
            lineColor="#007542"
            formatBar={(v) => String(Math.round(v))}
            formatLine={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)))}
            interval={1}
          />
        </div>
      </Card>

      {/* Status + Payment methods */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
          <ChartHeader
            title="Orders by Status"
            subtitle="All-time count per order status"
          />
          <div className="h-[240px] w-full mt-3">
            <SvgBarChart
              data={statusRows.map((r, i) => ({
                label: r.name,
                value: r.count,
                color: STATUS_COLORS[r.name] || SERIES_COLORS[i % SERIES_COLORS.length],
              }))}
              height={240}
              layout="horizontal"
              formatValue={(v) => String(Math.round(v))}
            />
          </div>
        </Card>

        <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
          <ChartHeader
            title="Payment Methods"
            subtitle="Distribution of orders by payment method"
          />
          <div className="h-[240px] w-full mt-3 flex items-center justify-center">
            <SvgDonutChart
              data={methodRows.map((r, i) => ({
                label: r.name,
                value: r.value,
                color: METHOD_COLORS[r.name] || SERIES_COLORS[i % SERIES_COLORS.length],
              }))}
              size={180}
              thickness={28}
            />
          </div>
        </Card>
      </div>

      {/* Top selling items */}
      <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
        <ChartHeader
          title="Top Selling Items"
          subtitle="Ranked by units sold (excludes cancelled orders)"
        />
        <div className="mt-3 rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-50/50 hover:bg-brand-50/50">
                <TableHead className="pl-4 w-12">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Relative Volume</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right pr-4">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    No sales recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {analytics.topItems.map((it, i) => {
                const pct = Math.max(4, Math.round((it.qty / maxQty) * 100));
                return (
                  <TableRow key={it.name}>
                    <TableCell className="pl-4">
                      <div className="h-6 w-6 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{it.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="h-2 rounded-full bg-muted overflow-hidden min-w-[120px]">
                        <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-brand-200">{it.qty}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4 font-semibold text-brand-700">{formatPKR(it.revenue)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Form Analytics */}
      {formData && formData.totalViews > 0 && (
        <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
          <ChartHeader
            title="Order Form Analytics"
            subtitle={`Last 14 days · ${formData.totalViews} total views · ${formData.conversionRate}% conversion`}
          />
          <div className="grid grid-cols-1 gap-4 mt-3 lg:grid-cols-3">
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2 lg:col-span-1">
              <div className="rounded-lg bg-brand-50/60 p-3 text-center">
                <Eye className="h-4 w-4 mx-auto text-brand-600" />
                <div className="mt-1 text-xl font-extrabold text-brand-700">{formData.totalViews}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Views</div>
              </div>
              <div className="rounded-lg bg-emerald-50/60 p-3 text-center">
                <MousePointerClick className="h-4 w-4 mx-auto text-emerald-600" />
                <div className="mt-1 text-xl font-extrabold text-emerald-700">{formData.formOrders}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Orders</div>
              </div>
              <div className="rounded-lg bg-amber-50/60 p-3 text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-amber-600" />
                <div className="mt-1 text-xl font-extrabold text-amber-700">{formData.conversionRate}%</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Conv.</div>
              </div>
            </div>
            {/* 14-day views bar chart */}
            <div className="lg:col-span-2">
              <div className="h-[180px] w-full">
                <SvgBarChart
                  data={formData.series.map((s) => ({ label: s.label, value: s.views, color: "#78D23D" }))}
                  height={180}
                  formatValue={(v) => String(Math.round(v))}
                />
              </div>
            </div>
          </div>
          {/* Source breakdown */}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(formData.bySource).map(([source, count]) => (
              <Badge key={source} variant="secondary" className="bg-brand-50 text-brand-700 border-brand-200">
                {source}: {count}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Subcomponents ---------------- */

const tooltipStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(30, 140, 69, 0.2)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

function HeaderKpi({
  icon,
  label,
  value,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "brand" | "amber" | "rose";
}) {
  return (
    <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div
          className={
            "h-10 w-10 rounded-lg text-white flex items-center justify-center shadow-sm " +
            (tone === "amber"
              ? "bg-gradient-to-br from-amber-500 to-amber-600"
              : tone === "rose"
                ? "bg-gradient-to-br from-rose-500 to-rose-600"
                : "bg-brand-gradient")
          }
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground truncate">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
