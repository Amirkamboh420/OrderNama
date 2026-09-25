"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  ChevronDown,
  Inbox,
  Download,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api, formatPKR, timeAgo } from "@/lib/api";
import { StatusBadge, PayBadge } from "@/components/ordernama/badges";
import {
  CreateOrderDialog,
  OrderDetailDialog,
  type OrderTemplate,
} from "@/components/ordernama/order-dialogs";
import { useApp } from "@/lib/store";

type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  courier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  source: string;
  items: { name: string; sku?: string; qty: number; price: number }[];
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    address: string | null;
  };
};

const PAGE_SIZE = 20;

const BULK_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export function OrdersList() {
  // Read global search from topbar (zustand)
  const globalSearch = useApp((s) => s.searchQuery);
  // Listen for "New Order" trigger fires (from keyboard 'n' shortcut + dashboard quick action)
  const newOrderTrigger = useApp((s) => s.newOrderTrigger);
  // Trigger fired by "Create similar order" buttons elsewhere — opens
  // the CreateOrderDialog pre-filled with the pending template.
  const duplicateOrderTrigger = useApp((s) => s.duplicateOrderTrigger);

  // Filters
  const [status, setStatus] = React.useState("all");
  const [payment, setPayment] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [sort, setSort] = React.useState("newest");

  // Data
  const [orders, setOrders] = React.useState<OrderListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  // Selection (bulk actions)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = React.useState("");
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [autoAdvanceBusy, setAutoAdvanceBusy] = React.useState(false);

  // Dialogs
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailOrderId, setDetailOrderId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  // Pre-fill template for the CreateOrderDialog (from "Create similar order")
  const [initialTemplate, setInitialTemplate] = React.useState<OrderTemplate | null>(null);

  // Debounce search query
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Sync global search (from topbar) → local q
  React.useEffect(() => {
    if (globalSearch !== q) setQ(globalSearch);
  }, [globalSearch]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [status, payment, debouncedQ, sort]);

  // Watch the "Create similar order" trigger: pull the pending template from
  // the store, open the CreateOrderDialog, and let the dialog consume the
  // template via the `initialTemplate` + `onTemplateConsumed` props.
  // NOTE: We use a ref guard so the effect only fires ONCE per trigger value,
  // even though setInitialTemplate causes a re-render. Without this, the
  // cleanup would cancel the pending open and the re-run would find the
  // template already cleared → dialog would never open.
  const lastTriggerHandled = React.useRef(0);
  React.useEffect(() => {
    if (duplicateOrderTrigger === 0) return;
    if (lastTriggerHandled.current === duplicateOrderTrigger) return;
    lastTriggerHandled.current = duplicateOrderTrigger;
    const tpl = useApp.getState().pendingOrderTemplate;
    if (!tpl) return;
    // Set createOpen FIRST (before setInitialTemplate) so the dialog mounts,
    // then pass the template — the dialog's own useEffect will consume it.
    setCreateOpen(true);
    setInitialTemplate(tpl);
    useApp.getState().setPendingOrderTemplate(null);
  }, [duplicateOrderTrigger]);

  // Watch the "New Order" trigger (keyboard 'n' / dashboard quick action)
  const lastNewOrderHandled = React.useRef(0);
  React.useEffect(() => {
    if (newOrderTrigger === 0) return;
    if (lastNewOrderHandled.current === newOrderTrigger) return;
    lastNewOrderHandled.current = newOrderTrigger;
    setCreateOpen(true);
  }, [newOrderTrigger]);

  const fetchOrders = React.useCallback(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    if (debouncedQ) params.set("q", debouncedQ);
    if (sort) params.set("sort", sort);
    params.set("limit", "200");

    api<{ orders: OrderListItem[]; count: number }>(
      `/api/orders?${params.toString()}`,
    )
      .then((r) => {
        if (!alive) return;
        setOrders(r.orders || []);
      })
      .catch((err) => {
        if (!alive) return;
        toast.error("Could not load orders", {
          description: err instanceof Error ? err.message : "",
        });
        setOrders([]);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [status, payment, debouncedQ, sort]);

  React.useEffect(() => {
    const cleanup = fetchOrders();
    return cleanup;
  }, [fetchOrders]);

  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = visibleCount < orders.length;

  /* ===== Selection helpers ===== */
  const visibleIds = visibleOrders.map((o) => o.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVisibleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  /* ===== CSV Export ===== */
  function exportCsv() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    if (debouncedQ) params.set("q", debouncedQ);
    const url = `/api/orders/export?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordernama-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Export ready!");
  }

  /* ===== Auto-advance stale orders ===== */
  async function handleAutoAdvance() {
    setAutoAdvanceBusy(true);
    try {
      const res = await api<{ advanced: number; details: { orderNumber: string; from: string; to: string }[] }>(
        "/api/orders/auto-advance",
        { method: "POST" },
      );
      if (res.advanced > 0) {
        toast.success(`Auto-advanced ${res.advanced} order${res.advanced > 1 ? "s" : ""}`, {
          description: res.details
            .slice(0, 5)
            .map((d) => `${d.orderNumber}: ${d.from} → ${d.to}`)
            .join("\n"),
        });
        fetchOrders();
      } else {
        toast.info("Koi order auto-advance ke liye nahi mila", {
          description: "All orders are already in their final status or too recent.",
        });
      }
    } catch {
      toast.error("Auto-advance fail ho gaya");
    } finally {
      setAutoAdvanceBusy(false);
    }
  }

  /* ===== Bulk update ===== */
  async function bulkUpdate(payload: {
    status?: string;
    paymentStatus?: string;
  }) {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const r = await api<{ updated: number; requested: number }>(
        `/api/orders/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ ids, ...payload }),
        },
      );
      toast.success(`Updated ${r.updated} order${r.updated === 1 ? "" : "s"}`);
      clearSelection();
      setBulkStatus("");
      fetchOrders();
    } catch (err) {
      toast.error("Bulk update failed", {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBulkBusy(false);
    }
  }

  function openDetail(id: string) {
    setDetailOrderId(id);
    setDetailOpen(true);
  }

  function onCreatedOrUpdated() {
    fetchOrders();
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div
      className={cn(
        "space-y-4 animate-fade-up",
        hasSelection && "pb-24 sm:pb-16",
      )}
    >
      {/* Filter bar */}
      <Card className="gap-0 p-4 shadow-none border-brand-100 bg-brand-50/30">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Payment
            </label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sort
            </label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="total_high">Total: high → low</SelectItem>
                <SelectItem value="total_low">Total: low → high</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Search
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Order # / name / phone"
                  className="pl-8 bg-background"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={fetchOrders}
                className="shrink-0 border-brand-200 text-brand-700 hover:bg-brand-50"
                aria-label="Refresh"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoAdvance}
                disabled={autoAdvanceBusy}
                className="shrink-0 border-brand-300 text-brand-700 hover:bg-brand-50"
                title="Auto-advance stale orders (Pending→Confirmed→Shipped→Delivered)"
              >
                <Zap className={cn("size-4", autoAdvanceBusy && "animate-pulse")} />
                <span className="hidden sm:inline ml-1">Auto-advance</span>
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={exportCsv}
                className="shrink-0 border-brand-200 text-brand-700 hover:bg-brand-50"
                aria-label="Export CSV"
                title="Export CSV"
              >
                <Download className="size-4" />
              </Button>
              <Button
                size="icon"
                onClick={() => setCreateOpen(true)}
                className="shrink-0 bg-brand-gradient text-white hover:opacity-90"
                aria-label="New order"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Counts */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Loading…
              </span>
            ) : (
              <>
                <span className="font-semibold text-foreground">{orders.length}</span>{" "}
                {orders.length === 1 ? "order" : "orders"} found
              </>
            )}
          </span>
          {(status !== "all" || payment !== "all" || debouncedQ) && (
            <button
              type="button"
              onClick={() => {
                setStatus("all");
                setPayment("all");
                setQ("");
              }}
              className="text-brand-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Mobile action buttons — Export CSV + New Order */}
      <div className="flex gap-2 sm:hidden">
        <Button
          onClick={exportCsv}
          variant="outline"
          className="flex-1 border-brand-200 text-brand-700 hover:bg-brand-50"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex-1 bg-brand-gradient text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          New Order
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block gap-0 p-0 shadow-none border-brand-100 overflow-hidden">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-brand-100 hover:bg-transparent">
                  <TableHead className="w-10 pl-3 h-10">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleVisibleAll}
                      aria-label="Select all visible orders"
                    />
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3">
                    Order #
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3">
                    Customer
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3 text-center">
                    Items
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3 text-right">
                    Total
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3">
                    Payment
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3">
                    Date
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground h-10 px-3 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOrders.map((o) => {
                  const checked = selectedIds.has(o.id);
                  return (
                    <TableRow
                      key={o.id}
                      className={cn(
                        "border-b border-brand-100 hover:bg-brand-50/40 cursor-pointer",
                        checked && "bg-brand-50/70",
                      )}
                      onClick={() => openDetail(o.id)}
                    >
                      <TableCell
                        className="w-10 pl-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleOne(o.id)}
                          aria-label={`Select order ${o.orderNumber}`}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-3 font-mono text-xs font-medium text-brand-700">
                        {o.orderNumber}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {o.customer.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {o.customer.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[11px] font-medium">
                          {o.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-semibold">
                        {formatPKR(o.total)}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <PayBadge status={o.paymentStatus} />
                      </TableCell>
                      <TableCell className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(o.createdAt)}
                      </TableCell>
                      <TableCell
                        className="px-3 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetail(o.id)}
                          className="border-brand-200 text-brand-700 hover:bg-brand-50 h-8"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {visibleOrders.map((o) => {
              const checked = selectedIds.has(o.id);
              return (
                <Card
                  key={o.id}
                  onClick={() => openDetail(o.id)}
                  className={cn(
                    "gap-2 p-3 shadow-none border-brand-100 hover:bg-brand-50/40 cursor-pointer",
                    checked && "border-brand-300 bg-brand-50/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-medium text-brand-700">
                        {o.orderNumber}
                      </div>
                      <div className="font-semibold text-foreground truncate">
                        {o.customer.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {o.customer.phone}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatPKR(o.total)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {o.items.length} items
                        </div>
                      </div>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-0.5"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleOne(o.id)}
                          aria-label={`Select order ${o.orderNumber}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-brand-100">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={o.status} />
                      <PayBadge status={o.paymentStatus} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(o.createdAt)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="border-brand-200 text-brand-700 hover:bg-brand-50"
              >
                <ChevronDown className="size-4" />
                Load more ({orders.length - visibleCount} left)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bulk action bar — fixed bottom, brand gradient */}
      {hasSelection && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-3xl animate-slide-in-up">
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-gradient px-3 py-2.5 shadow-lg text-white">
            <span className="font-semibold text-sm whitespace-nowrap">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={bulkBusy}
              className="text-white hover:bg-white/20 hover:text-white h-8"
            >
              Clear
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select
                value={bulkStatus}
                onValueChange={(v) => {
                  setBulkStatus("");
                  void bulkUpdate({ status: v });
                }}
              >
                <SelectTrigger className="h-8 w-[140px] border-white/40 bg-white/10 text-white hover:bg-white/20 focus:ring-white/30">
                  <SelectValue placeholder="Set status..." />
                </SelectTrigger>
                <SelectContent>
                  {BULK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void bulkUpdate({ paymentStatus: "Paid" })}
                disabled={bulkBusy}
                className="h-8 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Mark Paid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void bulkUpdate({ paymentStatus: "Unpaid" })}
                disabled={bulkBusy}
                className="h-8 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Mark Unpaid
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onCreatedOrUpdated}
        initialTemplate={initialTemplate}
        onTemplateConsumed={() => setInitialTemplate(null)}
      />
      <OrderDetailDialog
        orderId={detailOrderId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={onCreatedOrUpdated}
      />
    </div>
  );
}

/* ---- Empty state ---- */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="gap-3 p-10 shadow-none border-dashed border-brand-200 bg-brand-50/30 items-center text-center">
      <div className="size-14 rounded-full bg-brand-gradient flex items-center justify-center text-white mx-auto">
        <Inbox className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">No orders yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first order or adjust your filters to see results.
        </p>
      </div>
      <Button
        onClick={onCreate}
        className="bg-brand-gradient text-white hover:opacity-90"
      >
        <Plus className="size-4" />
        New Order
      </Button>
    </Card>
  );
}

/* ---- Loading skeleton ---- */
function OrdersSkeleton() {
  return (
    <div className="space-y-2">
      <Card className="hidden md:block gap-0 p-0 shadow-none border-brand-100 overflow-hidden">
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 border-b border-brand-100"
            >
              <Skeleton className="h-4 w-4 rounded-[4px]" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-8 rounded-full" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </Card>
      <div className="md:hidden space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gap-2 p-3 shadow-none border-brand-100">
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
