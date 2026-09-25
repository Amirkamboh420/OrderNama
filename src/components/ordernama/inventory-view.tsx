"use client";

import * as React from "react";
import {
  Package,
  AlertTriangle,
  PackageX,
  Wallet,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Boxes,
  Tag,
  Upload,
  FileDown,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

import { api, formatPKR, formatNumber } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  stock: number;
  lowStockAt: number;
  price: number;
  soldCount: number;
  updatedAt: string;
};

export function InventoryView() {
  // Read global search from topbar (zustand)
  const globalSearch = useApp((s) => s.searchQuery);
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [lowOnly, setLowOnly] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<Item | null>(null);
  const [focusStock, setFocusStock] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Cross-view restock trigger (fired by Notifications "Restock" button)
  const restockTrigger = useApp((s) => s.restockTrigger);
  const restockItemId = useApp((s) => s.restockItemId);
  const lastRestockHandled = React.useRef(0);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Sync global search (from topbar) → local q
  React.useEffect(() => {
    if (globalSearch !== q) setQ(globalSearch);
  }, [globalSearch]);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (lowOnly) params.set("filter", "low");
      const res = await api<{ items: Item[] }>(`/api/inventory?${params.toString()}`);
      setItems(res.items);
    } catch (e) {
      toast.error("Failed to load inventory", { description: String(e) });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, lowOnly]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Watch the restock trigger — once items are loaded, open the edit dialog
  // with the matching item pre-loaded and the stock field focused.
  React.useEffect(() => {
    if (restockTrigger === 0) return;
    if (lastRestockHandled.current === restockTrigger) return;
    if (loading) return; // wait for items to finish loading
    if (!restockItemId) {
      lastRestockHandled.current = restockTrigger;
      return;
    }
    const item = items.find((it) => it.id === restockItemId);
    // Mark as handled regardless of whether we found the item — avoids
    // re-running on every items change.
    lastRestockHandled.current = restockTrigger;
    if (item) {
      setFocusStock(true);
      setEditItem(item);
    } else {
      toast.error("Restock item nahi mila", {
        description: "Item ab inventory list me nahi hai. Filter clear kar ke try karein.",
      });
    }
  }, [restockTrigger, loading, items, restockItemId]);

  const totalItems = items.length;
  const lowCount = items.filter((i) => i.stock <= i.lowStockAt && i.stock > 0).length;
  const outCount = items.filter((i) => i.stock <= 0).length;
  const stockValue = items.reduce((s, i) => s + (i.stock || 0) * (i.price || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HeaderKpi
          icon={<Boxes className="h-5 w-5" />}
          label="Total Items"
          value={formatNumber(totalItems)}
        />
        <HeaderKpi
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low Stock"
          value={formatNumber(lowCount)}
          tone="amber"
        />
        <HeaderKpi
          icon={<PackageX className="h-5 w-5" />}
          label="Out of Stock"
          value={formatNumber(outCount)}
          tone="rose"
        />
        <HeaderKpi
          icon={<Wallet className="h-5 w-5" />}
          label="Stock Value"
          value={formatPKR(stockValue)}
        />
      </div>

      {/* Filter bar */}
      <Card className="border-brand-200/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items by name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Switch checked={lowOnly} onCheckedChange={setLowOnly} />
              <span className="text-sm font-medium">Low stock only</span>
            </label>
            <Button onClick={() => setAddOpen(true)} className="bg-brand-gradient text-white hover:opacity-90">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={() => setCsvOpen(true)}
              className="border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Table (desktop) / Cards (mobile) */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-brand-200/60 p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-brand-gradient text-white flex items-center justify-center mb-3">
            <Package className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">No inventory items</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lowOnly ? "No low-stock items. Try clearing the filter." : "Add your first product to start tracking stock."}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block border-brand-200/60 p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-brand-50/50 hover:bg-brand-50/50">
                  <TableHead className="pl-4">Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Low At</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <InventoryRow
                    key={it.id}
                    it={it}
                    onEdit={() => setEditItem(it)}
                    onDelete={() => setDeleteId(it.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {items.map((it) => (
              <InventoryMobileCard
                key={it.id}
                it={it}
                onEdit={() => setEditItem(it)}
                onDelete={() => setDeleteId(it.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Add dialog */}
      <ItemFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="create"
        onDone={() => {
          setAddOpen(false);
          toast.success("Item created");
          fetchList();
        }}
      />

      {/* CSV import dialog */}
      <ImportCsvDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        onClose={() => setCsvOpen(false)}
        onRefetch={() => fetchList()}
      />

      {/* Edit dialog */}
      <ItemFormDialog
        open={!!editItem}
        item={editItem}
        focusStock={focusStock}
        onOpenChange={(o) => {
          if (!o) {
            setEditItem(null);
            setFocusStock(false);
          }
        }}
        mode="edit"
        onDone={() => {
          setEditItem(null);
          setFocusStock(false);
          toast.success("Item updated");
          fetchList();
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the inventory item. Orders already placed will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!deleteId) return;
                try {
                  await api(`/api/inventory/${deleteId}`, { method: "DELETE" });
                  toast.success("Item deleted");
                  setDeleteId(null);
                  fetchList();
                } catch (err) {
                  toast.error("Failed to delete", { description: String(err) });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- Subcomponents ---------------- */

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

function InventoryRow({
  it,
  onEdit,
  onDelete,
}: {
  it: Item;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const low = it.stock <= it.lowStockAt;
  const cap = Math.max(it.lowStockAt * 3, 1);
  const pct = Math.max(0, Math.min(100, (it.stock / cap) * 100));
  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="font-medium text-foreground">{it.name}</div>
        {it.sku && <div className="text-[11px] text-muted-foreground font-mono">{it.sku}</div>}
        <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden w-32">
          <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
        </div>
      </TableCell>
      <TableCell>
        {it.category ? (
          <Badge variant="outline" className="border-brand-200 text-brand-700 bg-brand-50/40">
            <Tag className="h-3 w-3" />
            {it.category}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className={low ? "text-rose-600 font-bold" : "text-foreground font-semibold"}>
          {it.stock}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{it.lowStockAt}</TableCell>
      <TableCell className="text-muted-foreground">{formatNumber(it.soldCount)}</TableCell>
      <TableCell className="font-semibold text-brand-700">{formatPKR(it.price)}</TableCell>
      <TableCell className="pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete" className="text-rose-600 hover:text-rose-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function InventoryMobileCard({
  it,
  onEdit,
  onDelete,
}: {
  it: Item;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const low = it.stock <= it.lowStockAt;
  const cap = Math.max(it.lowStockAt * 3, 1);
  const pct = Math.max(0, Math.min(100, (it.stock / cap) * 100));
  return (
    <Card className="border-brand-200/60 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-foreground truncate">{it.name}</div>
          {it.sku && <div className="text-[11px] text-muted-foreground font-mono">{it.sku}</div>}
        </div>
        {it.category && (
          <Badge variant="outline" className="border-brand-200 text-brand-700 bg-brand-50/40 shrink-0">
            {it.category}
          </Badge>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Stock level</span>
          <span className={low ? "text-rose-600 font-bold" : "text-brand-700 font-semibold"}>
            {it.stock} / {cap}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Separator className="my-3" />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Low At</div>
          <div className="text-sm font-semibold">{it.lowStockAt}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sold</div>
          <div className="text-sm font-semibold">{formatNumber(it.soldCount)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</div>
          <div className="text-sm font-semibold text-brand-700">{formatPKR(it.price)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </Card>
  );
}

function ItemFormDialog({
  open,
  onOpenChange,
  item,
  mode,
  focusStock = false,
  onDone,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  item?: Item | null;
  mode: "create" | "edit";
  focusStock?: boolean;
  onDone: () => void;
}) {
  const [form, setForm] = React.useState({
    name: "",
    sku: "",
    category: "",
    stock: "",
    lowStockAt: "5",
    price: "",
  });
  const [saving, setSaving] = React.useState(false);
  const stockRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        sku: item.sku || "",
        category: item.category || "",
        stock: String(item.stock ?? 0),
        lowStockAt: String(item.lowStockAt ?? 5),
        price: String(item.price ?? 0),
      });
    } else if (mode === "create" && open) {
      setForm({ name: "", sku: "", category: "", stock: "", lowStockAt: "5", price: "" });
    }
  }, [item, mode, open]);

  // When opened via the restock flow, focus + highlight the stock field so
  // the seller can immediately type a new stock number.
  React.useEffect(() => {
    if (!open || !focusStock) return;
    const t = setTimeout(() => {
      stockRef.current?.focus();
      stockRef.current?.select();
    }, 80);
    return () => clearTimeout(t);
  }, [open, focusStock]);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        category: form.category.trim() || null,
        stock: Number(form.stock) || 0,
        lowStockAt: Number(form.lowStockAt) || 5,
        price: Number(form.price) || 0,
      };
      if (mode === "create") {
        await api("/api/inventory", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (item) {
        await api(`/api/inventory/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      onDone();
    } catch (e) {
      toast.error(mode === "create" ? "Failed to create item" : "Failed to update item", {
        description: String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Inventory Item" : "Edit Inventory Item"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new product to your inventory."
              : focusStock
                ? "Restock this item — naya stock number type karein."
                : "Update stock, threshold, and price."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="i-name">Name *</Label>
            <Input id="i-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Lawn Suit — Blue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="i-sku">SKU</Label>
              <Input id="i-sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="LS-BL-01" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="i-cat">Category</Label>
              <Input id="i-cat" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Unstitched" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="i-stock">Stock</Label>
              <Input
                id="i-stock"
                ref={stockRef}
                type="number"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0"
                className={cn(
                  focusStock &&
                    "ring-2 ring-brand-400 ring-offset-1 border-brand-400"
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="i-low">Low At</Label>
              <Input id="i-low" type="number" inputMode="numeric" value={form.lowStockAt} onChange={(e) => set("lowStockAt", e.target.value)} placeholder="5" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="i-price">Price (PKR)</Label>
              <Input id="i-price" type="number" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="2500" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-brand-gradient text-white hover:opacity-90">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Add Item" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------- CSV Import ----------------------- */

const CSV_TEMPLATE = `name,sku,category,stock,lowStockAt,price
Lawn Suit Blue,LS-BL-01,Unstitched,24,5,2500
Cotton Kurti White,CK-WH-02,Stitched,12,3,1800`;

type ImportResponse = {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  total: number;
};

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ordernama-inventory-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Mirrors the server-side parser in /api/inventory/import so the preview
// matches what the API will actually create/update.
function parseCsv(csv: string): { headers: string[]; rows: string[][] } {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
  );
  return { headers, rows };
}

function ImportCsvDialog({
  open,
  onOpenChange,
  onClose,
  onRefetch,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onClose: () => void;
  onRefetch: () => void;
}) {
  const [csvText, setCsvText] = React.useState("");
  const [preview, setPreview] = React.useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [importErrors, setImportErrors] = React.useState<string[] | null>(null);

  // Reset state whenever the dialog opens fresh.
  React.useEffect(() => {
    if (open) {
      setCsvText("");
      setPreview(null);
      setImportErrors(null);
      setImporting(false);
    }
  }, [open]);

  const handleParse = () => {
    if (!csvText.trim()) {
      toast.error("Pehle CSV data paste karein");
      return;
    }
    const parsed = parseCsv(csvText);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      toast.error("CSV parse nahi hui — header aur kam az kam 1 row chahiye");
      setPreview(null);
      return;
    }
    setPreview(parsed);
    setImportErrors(null);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error("CSV khali hai");
      return;
    }
    setImporting(true);
    setImportErrors(null);
    try {
      const res = await api<ImportResponse>("/api/inventory/import", {
        method: "POST",
        body: JSON.stringify({ csv: csvText }),
      });
      // Per-row errors are returned alongside successful created/updated counts.
      // When no per-row errors: show success toast → refetch → close dialog.
      // When per-row errors: show warning toast + error list → refetch (keep
      // dialog open so the seller can see which rows failed).
      if (res.errors.length > 0) {
        setImportErrors(res.errors);
        toast.warning(`Imported ${res.total} items with ${res.errors.length} error(s)`, {
          description: `${res.created} created, ${res.updated} updated`,
        });
        onRefetch();
      } else {
        toast.success(`Imported ${res.total} items (${res.created} created, ${res.updated} updated)`, {
          description: res.skipped > 0 ? `${res.skipped} skipped` : undefined,
        });
        onRefetch();
        onClose();
      }
    } catch (e) {
      toast.error("Import fail hua", { description: String(e) });
    } finally {
      setImporting(false);
    }
  };

  const previewRows = preview?.rows.slice(0, 5) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-700" />
            Import Inventory from CSV
          </DialogTitle>
          <DialogDescription>
            Paste CSV with headers: <span className="font-mono">name,sku,category,stock,lowStockAt,price</span>.
            Items are matched by SKU (or name) and created/updated.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 max-h-[60vh] overflow-y-auto scrollbar-brand pr-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="csv-text">CSV Data</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="text-brand-700 hover:bg-brand-50"
            >
              <FileDown className="h-4 w-4" />
              Download template
            </Button>
          </div>
          <Textarea
            id="csv-text"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={CSV_TEMPLATE}
            className="font-mono text-xs h-48"
          />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleParse} disabled={importing}>
              <FileSpreadsheet className="h-4 w-4" />
              Parse preview
            </Button>
            <span className="text-[11px] text-muted-foreground">
              Preview shows the first 5 rows.
            </span>
          </div>

          {preview && (
            <div className="rounded-lg border border-brand-200/60 bg-brand-50/30 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-brand-100 text-xs text-brand-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Parsed {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"} ·{" "}
                {preview.headers.length} columns
              </div>
              {previewRows.length > 0 ? (
                <div className="overflow-x-auto scrollbar-brand">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-brand-50/40 hover:bg-brand-50/40">
                        {preview.headers.map((h, i) => (
                          <TableHead key={i} className="text-xs">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, ri) => (
                        <TableRow key={ri}>
                          {preview.headers.map((_, ci) => (
                            <TableCell key={ci} className="text-xs py-2">
                              {row[ci] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">No data rows parsed.</p>
              )}
              {preview.rows.length > 5 && (
                <p className="px-3 py-2 border-t border-brand-100 text-[11px] text-muted-foreground">
                  +{preview.rows.length - 5} more row(s) not shown.
                </p>
              )}
            </div>
          )}

          {importErrors && importErrors.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3">
              <p className="text-xs font-semibold text-rose-700 mb-1">
                {importErrors.length} error(s) during import:
              </p>
              <ul className="space-y-1 max-h-32 overflow-y-auto scrollbar-brand">
                {importErrors.map((err, i) => (
                  <li key={i} className="text-[11px] text-rose-700 font-mono">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            className="bg-brand-gradient text-white hover:opacity-90"
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
