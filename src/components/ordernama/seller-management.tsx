"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Ticket,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AnimatedNumber, AnimatedPKR } from "@/components/ordernama/animated-number";
import { api, formatNumber, formatPKR, timeAgo } from "@/lib/api";
import { cn } from "@/lib/utils";

/* --------------------------------- types --------------------------------- */

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

function RowSkeleton() {
  return <Skeleton className="h-12 w-full" />;
}

/* ----------------------------- detail dialog ----------------------------- */

function SellerDetailDialog({
  seller,
  open,
  onOpenChange,
}: {
  seller: AdminSeller | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  if (!seller) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }
  const plan = normalizePlan(seller.plan);
  const stats = [
    {
      label: "Orders",
      value: seller.orderCount,
      icon: ShoppingBag,
      numeric: true,
    },
    {
      label: "Revenue",
      value: seller.revenue,
      icon: Wallet,
      pkr: true,
    },
    {
      label: "Customers",
      value: seller.customerCount,
      icon: Users,
      numeric: true,
    },
    {
      label: "Inventory",
      value: seller.inventoryCount,
      icon: Building2,
      numeric: true,
    },
    {
      label: "Staff",
      value: seller.staffCount,
      icon: UserCheck,
      numeric: true,
    },
    {
      label: "Open Tickets",
      value: seller.ticketCount,
      icon: Ticket,
      numeric: true,
    },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white">
              <Building2 className="h-5 w-5" />
            </span>
            {seller.businessName}
            <PlanBadge plan={seller.plan} />
          </DialogTitle>
          <DialogDescription>
            Full seller profile and platform stats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-brand-100 bg-brand-50/40 p-4 text-sm">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Owner
              </div>
              <div className="mt-0.5 font-medium">{seller.ownerName}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Phone
              </div>
              <div className="mt-0.5 font-mono text-xs">{seller.phone}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </div>
              <div className="mt-0.5 text-xs">
                {seller.email || "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                City
              </div>
              <div className="mt-0.5">{seller.city || "—"}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Joined
              </div>
              <div className="mt-0.5">
                {new Date(seller.createdAt).toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {timeAgo(seller.createdAt)}
              </div>
            </div>
          </div>

          <Separator className="bg-brand-100/70" />

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-brand-100 p-3"
              >
                <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-300">
                  <s.icon className="h-4 w-4" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                <div className="mt-1.5 text-lg font-extrabold tabular-nums">
                  {"pkr" in s && s.pkr ? (
                    <AnimatedPKR value={s.value} />
                  ) : (
                    <AnimatedNumber
                      value={s.value}
                      format={(n) => formatNumber(Math.round(n))}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- main ------------------------------- */

export function SellerManagement() {
  // Filters
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [plan, setPlan] = React.useState("all");
  const [sort, setSort] = React.useState("newest");

  // Data
  const [sellers, setSellers] = React.useState<AdminSeller[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog
  const [detailSeller, setDetailSeller] = React.useState<AdminSeller | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchSellers = React.useCallback(() => {
    let alive = true;
    setLoading(true);
    // NOTE: The /api/admin/sellers endpoint currently ignores query params,
    // but we still forward them so future API support is transparent. All
    // active filtering / sorting happens client-side on the returned list.
    const params = new URLSearchParams({
      status: "",
      plan,
      sort,
    });
    api<SellersResponse>(`/api/admin/sellers?${params.toString()}`)
      .then((r) => {
        if (!alive) return;
        setSellers(r.sellers || []);
      })
      .catch((err) => {
        if (!alive) return;
        toast.error("Could not load sellers", {
          description: err instanceof Error ? err.message : "",
        });
        setSellers([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [plan, sort]);

  React.useEffect(() => {
    const cleanup = fetchSellers();
    return cleanup;
  }, [fetchSellers]);

  // Client-side filtering + sorting
  const visibleSellers = React.useMemo(() => {
    const needle = debouncedQ.toLowerCase();
    let list = sellers.filter((s) => {
      if (plan !== "all" && normalizePlan(s.plan) !== plan) return false;
      if (!needle) return true;
      const hay = [
        s.businessName,
        s.ownerName,
        s.city || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
    list = [...list];
    switch (sort) {
      case "revenue":
        list.sort((a, b) => b.revenue - a.revenue);
        break;
      case "orders":
        list.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case "name":
        list.sort((a, b) =>
          a.businessName.localeCompare(b.businessName, "en", {
            sensitivity: "base",
          }),
        );
        break;
      case "newest":
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
    return list;
  }, [sellers, debouncedQ, plan, sort]);

  function openDetail(s: AdminSeller) {
    setDetailSeller(s);
    setDetailOpen(true);
  }

  const hasFilters = plan !== "all" || debouncedQ !== "";

  return (
    <div className="space-y-4 animate-fade-up sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Seller Management
        </h1>
        <p className="text-sm text-muted-foreground">
          All registered sellers on the platform
        </p>
      </div>

      <Separator className="bg-brand-100/70 dark:bg-brand-800/40" />

      {/* Filter bar */}
      <Card className="gap-0 border-brand-100 bg-brand-50/30 p-4 shadow-none">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plan
            </label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
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
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Search
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Business / owner / city"
                  className="bg-background pl-8"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={fetchSellers}
                className="shrink-0 border-brand-200 text-brand-700 hover:bg-brand-50"
                aria-label="Refresh"
              >
                <RefreshCw
                  className={cn("size-4", loading && "animate-spin")}
                />
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
                <span className="font-semibold text-foreground">
                  {visibleSellers.length}
                </span>{" "}
                {visibleSellers.length === 1 ? "seller" : "sellers"} found
              </>
            )}
          </span>
          {hasFilters && !loading && (
            <button
              type="button"
              onClick={() => {
                setPlan("all");
                setQ("");
                setSort("newest");
              }}
              className="text-brand-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <Card className="gap-0 border-brand-100 p-4 shadow-none">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </Card>
      ) : visibleSellers.length === 0 ? (
        <Card className="border-brand-100 p-10 text-center shadow-none">
          <div className="grid mx-auto h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium">No sellers found</p>
          <p className="text-xs text-muted-foreground">
            {hasFilters
              ? "Try adjusting your filters or search query"
              : "Sellers will appear here as they sign up"}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden gap-0 overflow-hidden border-brand-100 p-0 shadow-none md:block">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-brand-100 bg-brand-50/60 hover:bg-brand-50/60">
                  <TableHead className="pl-3">Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Staff</TableHead>
                  <TableHead className="text-right">Tickets</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="pr-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSellers.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-brand-100 hover:bg-brand-50/40"
                  >
                    <TableCell className="py-2.5 pl-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-gradient text-xs font-bold text-white">
                          {s.businessName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {s.businessName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.email || s.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm">
                      {s.ownerName}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <PlanBadge plan={s.plan} />
                    </TableCell>
                    <TableCell className="py-2.5 text-sm">
                      {s.city || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm tabular-nums">
                      {formatNumber(s.orderCount)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm font-semibold tabular-nums">
                      {formatPKR(s.revenue)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm tabular-nums">
                      {formatNumber(s.staffCount)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm tabular-nums">
                      {s.ticketCount > 0 ? (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          {formatNumber(s.ticketCount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {timeAgo(s.createdAt)}
                    </TableCell>
                    <TableCell className="py-2.5 pr-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-brand-200 text-brand-700 hover:bg-brand-50"
                        onClick={() => openDetail(s)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {visibleSellers.map((s) => (
              <Card
                key={s.id}
                className="border border-brand-100 p-4 shadow-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-gradient text-xs font-bold text-white">
                      {s.businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {s.businessName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.ownerName} · {s.city || "—"}
                      </div>
                    </div>
                  </div>
                  <PlanBadge plan={s.plan} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-brand-100 px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Orders
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatNumber(s.orderCount)}
                    </div>
                  </div>
                  <div className="rounded-md border border-brand-100 px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Revenue
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatPKR(s.revenue)}
                    </div>
                  </div>
                  <div className="rounded-md border border-brand-100 px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Staff
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatNumber(s.staffCount)}
                    </div>
                  </div>
                  <div className="rounded-md border border-brand-100 px-2 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Open Tickets
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatNumber(s.ticketCount)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Joined {timeAgo(s.createdAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-brand-200 text-brand-700 hover:bg-brand-50"
                    onClick={() => openDetail(s)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <SellerDetailDialog
        seller={detailSeller}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
