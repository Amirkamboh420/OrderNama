"use client";

import * as React from "react";
import {
  Users,
  UserPlus,
  Search,
  Repeat,
  Eye,
  Phone,
  MapPin,
  Instagram,
  MessageCircle,
  ShoppingBag,
  Wallet,
  Loader2,
  X,
  Tag,
  Plus,
  Check,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

import { api, formatPKR, formatNumber, timeAgo } from "@/lib/api";
import { StatusBadge, PayBadge } from "@/components/ordernama/badges";
import { useApp } from "@/lib/store";

type Customer = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  address: string | null;
  instagram: string | null;
  notes: string | null;
  tags: string;
  birthday: string | null;
  isRepeat: boolean;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
};

type CustomerDetail = Customer & {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    items: Array<{ name: string; qty: number; price: number }>;
  }>;
};

type ManageTagsTarget = {
  id: string;
  name: string;
  tags: string;
};

// Brand-tinted colors per known tag, fallback to muted
const TAG_COLORS: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-800",
  "Repeat Buyer": "bg-emerald-100 text-emerald-800",
  Wholesale: "bg-purple-100 text-purple-800",
  JazzCash: "bg-blue-100 text-blue-800",
  "Fast Delivery": "bg-brand-100 text-brand-800",
  New: "bg-rose-100 text-rose-800",
};
const FALLBACK_TAG_COLOR = "bg-muted text-muted-foreground";

function tagsToArray(tags: string | null | undefined): string[] {
  return (tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function phoneDigits(p: string) {
  return (p || "").replace(/[^\d]/g, "").replace(/^0+/, "");
}

export function CustomersView() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [sort, setSort] = React.useState("recent");
  const [addOpen, setAddOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  // Tag filter state
  const [allTags, setAllTags] = React.useState<string[]>([]);
  const [tagCounts, setTagCounts] = React.useState<Record<string, number>>({});
  const [cachedTotal, setCachedTotal] = React.useState(0);
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [manageTagsTarget, setManageTagsTarget] = React.useState<ManageTagsTarget | null>(null);

  // Sync global topbar search → local q (so Customers view reacts to topbar input)
  const globalSearch = useApp((s) => s.searchQuery);
  React.useEffect(() => {
    if (globalSearch !== q) setQ(globalSearch);
  }, [globalSearch]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (sort) params.set("sort", sort);
      if (activeTag) params.set("tag", activeTag);
      const res = await api<{ customers: Customer[]; count: number; tags: string[] }>(
        `/api/customers?${params.toString()}`
      );
      setCustomers(res.customers);
      // Only refresh tag metadata when no tag filter is active — preserves the
      // chips list + counts while the user is filtering by a specific tag.
      if (!activeTag) {
        setAllTags(res.tags || []);
        setCachedTotal(res.customers.length);
        const counts: Record<string, number> = {};
        for (const c of res.customers) {
          for (const t of tagsToArray(c.tags)) {
            counts[t] = (counts[t] || 0) + 1;
          }
        }
        setTagCounts(counts);
      }
    } catch (e) {
      toast.error("Failed to load customers", { description: String(e) });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, sort, activeTag]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const totalCustomers = customers.length;
  const repeatCount = customers.filter((c) => c.isRepeat).length;
  const totalLTV = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header KPI card */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HeaderKpi
          icon={<Users className="h-5 w-5" />}
          label="Total Customers"
          value={formatNumber(totalCustomers)}
        />
        <HeaderKpi
          icon={<Repeat className="h-5 w-5" />}
          label="Repeat Customers"
          value={formatNumber(repeatCount)}
        />
        <HeaderKpi
          icon={<Wallet className="h-5 w-5" />}
          label="Lifetime Value"
          value={formatPKR(totalLTV)}
        />
      </div>

      {/* Filter bar */}
      <Card className="border-brand-200/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, city or @instagram"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
                <SelectItem value="spent">Highest Spent</SelectItem>
                <SelectItem value="name">Name A→Z</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setAddOpen(true)} className="bg-brand-gradient text-white hover:opacity-90">
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Tag filter chips row */}
        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition",
                activeTag === null
                  ? "bg-brand-gradient text-white border-transparent shadow-sm"
                  : "bg-white text-muted-foreground border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              All <span className="opacity-70">({formatNumber(cachedTotal)})</span>
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTag((prev) => (prev === t ? null : t))}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition",
                  activeTag === t
                    ? "bg-brand-gradient text-white border-transparent shadow-sm"
                    : "bg-white text-muted-foreground border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                {t} <span className="opacity-70">({formatNumber(tagCounts[t] || 0)})</span>
              </button>
            ))}
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                aria-label="Clear tag filter"
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <CustomerCard
              key={c.id}
              c={c}
              onView={() => setDetailId(c.id)}
              onManageTags={() =>
                setManageTagsTarget({ id: c.id, name: c.name, tags: c.tags })
              }
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <AddCustomerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          setAddOpen(false);
          toast.success("Customer added");
          fetchList();
        }}
      />

      {/* Detail dialog */}
      <CustomerDetailDialog
        id={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onManageTags={(c) => {
          setDetailId(null);
          setManageTagsTarget({ id: c.id, name: c.name, tags: c.tags });
        }}
      />

      {/* Manage tags dialog */}
      <ManageTagsDialog
        target={manageTagsTarget}
        allTags={allTags}
        onOpenChange={(o) => !o && setManageTagsTarget(null)}
        onSaved={fetchList}
      />
    </div>
  );
}

/* ---------------- Subcomponents ---------------- */

function HeaderKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-brand-gradient text-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-extrabold text-foreground">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        TAG_COLORS[tag] || FALLBACK_TAG_COLOR
      )}
    >
      {tag}
    </span>
  );
}

function CustomerCard({
  c,
  onView,
  onManageTags,
}: {
  c: Customer;
  onView: () => void;
  onManageTags: () => void;
}) {
  const digits = phoneDigits(c.phone);
  const tags = tagsToArray(c.tags);
  return (
    <Card className="border-brand-200/60 p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-brand-gradient text-white text-base font-bold flex items-center justify-center shrink-0">
            {(c.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">{c.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" /> {c.phone || "—"}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {c.isRepeat && (
            <span className="inline-flex items-center gap-1 rounded-full border bg-amber-100 text-amber-800 border-amber-200 px-2 py-0.5 text-[11px] font-medium">
              <Repeat className="h-3 w-3" /> Repeat
            </span>
          )}
          {c.birthday && (() => {
            const month = parseInt(c.birthday.split("-")[1], 10);
            const now = new Date();
            const isThisMonth = month === now.getMonth() + 1;
            const day = parseInt(c.birthday.split("-")[2], 10);
            const isToday = isThisMonth && day === now.getDate();
            if (isToday) return (
              <span className="inline-flex items-center gap-1 rounded-full border bg-rose-100 text-rose-700 border-rose-200 px-2 py-0.5 text-[11px] font-medium">
                🎂 Today
              </span>
            );
            if (isThisMonth) return (
              <span className="inline-flex items-center gap-1 rounded-full border bg-pink-50 text-pink-700 border-pink-200 px-2 py-0.5 text-[11px] font-medium">
                <Gift className="h-3 w-3" /> {day} {now.toLocaleString("en-PK", { month: "short" })}
              </span>
            );
            return null;
          })()}
        </div>
      </div>

      {/* Tag pills */}
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      )}

      <Separator className="my-3" />

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{c.city || "—"}</span>
        </div>
        {c.instagram && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Instagram className="h-3.5 w-3.5" />
            <span className="truncate">@{c.instagram.replace(/^@/, "")}</span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-brand-50/60 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</div>
          <div className="text-sm font-bold text-brand-700">{formatNumber(c.totalOrders)}</div>
        </div>
        <div className="rounded-lg bg-brand-50/60 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Spent</div>
          <div className="text-sm font-bold text-brand-700">{formatPKR(c.totalSpent)}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onView}>
          <Eye className="h-3.5 w-3.5" /> View
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onManageTags}
          aria-label="Manage tags"
          title="Manage tags"
          className="text-brand-700 hover:bg-brand-50"
        >
          <Tag className="h-3.5 w-3.5" /> Tags
        </Button>
        {digits && (
          <a
            href={`https://wa.me/${digits}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium text-brand-700 hover:bg-accent transition"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
      </div>
    </Card>
  );
}

function AddCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    instagram: "",
    notes: "",
    birthday: "",
  });
  const [saving, setSaving] = React.useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      await api("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim() || null,
          address: form.address.trim() || null,
          instagram: form.instagram.trim().replace(/^@/, "") || null,
          notes: form.notes.trim() || null,
          birthday: form.birthday || null,
        }),
      });
      setForm({ name: "", phone: "", city: "", address: "", instagram: "", notes: "", birthday: "" });
      onCreated();
    } catch (e) {
      toast.error("Failed to add customer", { description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>Create a new customer record. Phone must be unique.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="c-name">Name *</Label>
            <Input id="c-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ayesha Khan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-phone">Phone *</Label>
            <Input id="c-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03001234567" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-city">City</Label>
              <Input id="c-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Karachi" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-ig">Instagram</Label>
              <Input id="c-ig" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="handle" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-bday">Birthday</Label>
            <Input id="c-bday" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-addr">Address</Label>
            <Input id="c-addr" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="House #, street, area" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-notes">Notes</Label>
            <Input id="c-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Preferences, sizes, etc." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-brand-gradient text-white hover:opacity-90">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailDialog({
  id,
  onOpenChange,
  onManageTags,
}: {
  id: string | null;
  onOpenChange: (b: boolean) => void;
  onManageTags: (c: { id: string; name: string; tags: string }) => void;
}) {
  const [data, setData] = React.useState<CustomerDetail | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    api<CustomerDetail>(`/api/customers/${id}`)
      .then((d) => setData(d))
      .catch((e) => toast.error("Failed to load customer", { description: String(e) }))
      .finally(() => setLoading(false));
  }, [id]);

  const tags = data ? tagsToArray(data.tags) : [];

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>Profile + order history.</DialogDescription>
        </DialogHeader>

        {loading || !data ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-full bg-brand-gradient text-white text-lg font-bold flex items-center justify-center shrink-0">
                {(data.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{data.name}</h3>
                  {data.isRepeat && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-amber-100 text-amber-800 border-amber-200 px-2 py-0.5 text-[11px] font-medium">
                      <Repeat className="h-3 w-3" /> Repeat
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {data.phone}</div>
                  {data.city && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {data.city}</div>}
                  {data.instagram && (
                    <div className="flex items-center gap-1.5"><Instagram className="h-3 w-3" /> @{data.instagram.replace(/^@/, "")}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags row with manage button */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Tags:</span>
                {tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Koi tag nahi</span>
                ) : (
                  tags.map((t) => <TagPill key={t} tag={t} />)
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onManageTags({ id: data.id, name: data.name, tags: data.tags })
                }
                className="text-brand-700 hover:bg-brand-50"
              >
                <Tag className="h-3.5 w-3.5" /> Manage tags
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Orders" value={formatNumber(data.totalOrders)} icon={<ShoppingBag className="h-3.5 w-3.5" />} />
              <MiniStat label="Spent" value={formatPKR(data.totalSpent)} icon={<Wallet className="h-3.5 w-3.5" />} />
              <MiniStat label="Joined" value={timeAgo(data.createdAt)} icon={<Users className="h-3.5 w-3.5" />} />
            </div>

            {data.address && (
              <div className="rounded-md border border-brand-200/60 bg-brand-50/40 p-2.5 text-xs">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Address</div>
                {data.address}
              </div>
            )}
            {data.notes && (
              <div className="rounded-md border bg-muted/40 p-2.5 text-xs">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Notes</div>
                {data.notes}
              </div>
            )}

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Order History</h4>
                <Badge variant="secondary" className="text-[10px]">{data.orders.length} orders</Badge>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-brand rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Order</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Pay</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                          No orders yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {data.orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs">
                          <div className="font-medium">{o.orderNumber}</div>
                          <div className="text-[10px] text-muted-foreground">{timeAgo(o.createdAt)}</div>
                        </TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell><PayBadge status={o.paymentStatus} /></TableCell>
                        <TableCell className="text-right text-xs font-semibold text-brand-700">{formatPKR(o.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManageTagsDialog({
  target,
  allTags,
  onOpenChange,
  onSaved,
}: {
  target: ManageTagsTarget | null;
  allTags: string[];
  onOpenChange: (b: boolean) => void;
  onSaved: () => void;
}) {
  const [tagsText, setTagsText] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (target) {
      setTagsText(target.tags || "");
      setNewTag("");
    }
  }, [target]);

  const currentTags = tagsToArray(tagsText);

  const toggleSuggested = (tag: string) => {
    if (currentTags.includes(tag)) {
      setTagsText(currentTags.filter((t) => t !== tag).join(", "));
    } else {
      setTagsText([...currentTags, tag].join(", "));
    }
  };

  const addNewTag = () => {
    const t = newTag.trim();
    if (!t) return;
    if (currentTags.map((x) => x.toLowerCase()).includes(t.toLowerCase())) {
      setNewTag("");
      return;
    }
    setTagsText([...currentTags, t].join(", "));
    setNewTag("");
  };

  const save = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await api(`/api/customers/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ tags: tagsText.trim() }),
      });
      toast.success("Tags update ho gaye");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error("Tags update nahi ho sake", { description: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            {target ? `Tags for ${target.name}` : "Edit customer tags"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Current tags — editable text */}
          <div className="grid gap-1.5">
            <Label htmlFor="tags-text">Tags (comma-separated)</Label>
            <Input
              id="tags-text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="VIP, Repeat Buyer"
            />
          </div>

          {/* Suggested tags */}
          {allTags.length > 0 && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Suggested tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => {
                  const active = currentTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleSuggested(t)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition",
                        active
                          ? "bg-brand-gradient text-white border-transparent shadow-sm"
                          : "bg-white text-muted-foreground border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new tag */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Add new tag</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewTag();
                  }
                }}
                placeholder="e.g. Prepaid"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addNewTag}
                disabled={!newTag.trim()}
                className="border-brand-300 text-brand-700 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {/* Live preview */}
          {currentTags.length > 0 && (
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="flex flex-wrap gap-1 rounded-md border bg-brand-50/40 p-2.5">
                {currentTags.map((t) => (
                  <TagPill key={t} tag={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-brand-gradient text-white hover:opacity-90">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-200/60 bg-brand-50/40 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-xs font-bold text-brand-700 mt-0.5">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-brand-200/60 p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-brand-gradient text-white flex items-center justify-center mb-3">
        <Users className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">No customers found</h3>
      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or add a new customer.</p>
    </Card>
  );
}
