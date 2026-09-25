"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell,
  AlertTriangle,
  Package,
  Clock,
  Wallet,
  MessageCircle,
  RefreshCw,
  Truck,
  ArrowRight,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { api, formatPKR } from "@/lib/api";
import { useApp } from "@/lib/store";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type LowStockItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockAt: number;
};

type UnpaidOrder = {
  id: string;
  orderNumber: string;
  total: number;
  customer: string;
};

type NotificationsData = {
  lowStock: LowStockItem[];
  pendingOrders: number;
  unpaidOrders: UnpaidOrder[];
  failedWhatsapps: number;
};

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

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "amber" | "blue" | "rose" | "purple";
}) {
  const toneClasses: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50/60 text-amber-700",
    blue: "border-blue-200 bg-blue-50/60 text-blue-700",
    rose: "border-rose-200 bg-rose-50/60 text-rose-700",
    purple: "border-purple-200 bg-purple-50/60 text-purple-700",
  };
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClasses[tone]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-extrabold text-foreground">{value}</div>
    </Card>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function NotificationsView() {
  const setView = useApp((s) => s.setView);
  const fireRestock = useApp((s) => s.fireRestock);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NotificationsData | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<NotificationsData>("/api/notifications");
      setData(res);
    } catch (e) {
      toast.error("Notifications load nahi hui", { description: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleRestock(item: LowStockItem) {
    setRestocking(item.id);
    toast.info("Restock flow", {
      description: `${item.name} (${item.sku}) ka edit dialog inventory me open ho raha hai.`,
      duration: 2400,
    });
    // Fire the cross-view trigger so InventoryView opens the edit dialog with this item
    fireRestock(item.id);
    // Brief delay so the toast is visible before the view swaps
    setTimeout(() => {
      setRestocking(null);
      setView("inventory");
    }, 500);
  }

  function handleRetryAll() {
    setRetrying(true);
    toast.info("Retry all started", {
      description: "Failed WhatsApp messages re-send ho rahe hain (demo).",
    });
    setTimeout(() => {
      setRetrying(false);
      toast.success("Retry complete", { description: "All messages sent." });
      load();
    }, 900);
  }

  function handleViewOrder(orderNumber: string) {
    toast.info(`Order ${orderNumber} open ho raha hai...`, { duration: 1500 });
    setView("orders");
  }

  if (loading || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const lowStockCount = data.lowStock.length;
  const unpaidCount = data.unpaidOrders.length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Bell className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Low stock alerts, pending orders, unpaid invoices aur failed WhatsApp messages ka
          overview.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low Stock Items"
          value={lowStockCount}
          tone="amber"
        />
        <KpiCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending Orders"
          value={data.pendingOrders}
          tone="blue"
        />
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Unpaid Orders"
          value={unpaidCount}
          tone="rose"
        />
        <KpiCard
          icon={<MessageCircle className="h-4 w-4" />}
          label="Failed WhatsApps"
          value={data.failedWhatsapps}
          tone="purple"
        />
      </div>

      {/* Low Stock Alerts */}
      <Card className="gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">Low Stock Alerts</h2>
          </div>
          <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
            {lowStockCount}
          </Badge>
        </div>
        <Separator />
        {lowStockCount === 0 ? (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            message="Sab items sufficient stock pe hain. Koi alert nahi."
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.lowStock.map((item) => {
              const critical = item.stock <= 0;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {item.sku}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          critical ? "text-rose-700" : "text-amber-700"
                        }`}
                      >
                        Stock: {item.stock}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Threshold: {item.lowStockAt}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRestock(item)}
                    disabled={restocking === item.id}
                    className="bg-brand-gradient text-white hover:opacity-90"
                  >
                    {restocking === item.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Truck className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Restock
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Unpaid Orders */}
      <Card className="gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <Wallet className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">Unpaid Orders</h2>
          </div>
          <Badge variant="outline" className="border-rose-200 bg-rose-100 text-rose-800">
            {unpaidCount}
          </Badge>
        </div>
        <Separator />
        {unpaidCount === 0 ? (
          <EmptyState
            icon={<Wallet className="h-5 w-5" />}
            message="Sab recent orders paid hain. Koi unpaid invoice nahi."
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.unpaidOrders.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{o.orderNumber}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{o.customer}</span>
                  </div>
                  <div className="text-sm font-semibold text-rose-700">
                    {formatPKR(o.total)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewOrder(o.orderNumber)}
                  className="border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  View
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pending Orders + Failed WhatsApp grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">Pending Orders</h2>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800">
              {data.pendingOrders}
            </Badge>
          </div>
          <Separator />
          {data.pendingOrders === 0 ? (
            <EmptyState
              icon={<Clock className="h-5 w-5" />}
              message="Koi pending order nahi. Sab confirm ho chuke."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div className="text-3xl font-extrabold text-foreground">
                  {data.pendingOrders}
                </div>
                <div className="text-xs text-muted-foreground">awaiting confirmation</div>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.pendingOrders} order{data.pendingOrders === 1 ? "" : "s"} customer
                confirmation ka wait kar rahe hain. Jald confirm karein taake WhatsApp auto-notify
                ho sake.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setView("orders")}
                className="w-full border-brand-300 text-brand-700 hover:bg-brand-50"
              >
                Open Orders
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </Card>

        <Card className="gap-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <MessageCircle className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">Failed WhatsApp</h2>
            </div>
            <Badge variant="outline" className="border-purple-200 bg-purple-100 text-purple-800">
              {data.failedWhatsapps}
            </Badge>
          </div>
          <Separator />
          {data.failedWhatsapps === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-5 w-5" />}
              message="Sab WhatsApp messages successfully bhej diye gaye. Koi failure nahi."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div className="text-3xl font-extrabold text-foreground">
                  {data.failedWhatsapps}
                </div>
                <div className="text-xs text-muted-foreground">failed messages</div>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.failedWhatsapps} message{data.failedWhatsapps === 1 ? "" : "s"} deliver nahi
                ho paaye. Number verify karein aur retry karein.
              </p>
              <Button
                size="sm"
                onClick={handleRetryAll}
                disabled={retrying}
                className="w-full bg-brand-gradient text-white hover:opacity-90"
              >
                {retrying ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                )}
                Retry all
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
