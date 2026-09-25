"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  RefreshCw,
  Inbox,
} from "lucide-react";

import { api } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";

/* ===== Types ===== */
type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: string; // "staff" | "manager"
  permissions: string; // comma-separated
  active: boolean;
  createdAt: string;
};

type StaffResponse = { staff: StaffMember[]; count: number };

/* ===== Constants ===== */
const ALL_PERMISSIONS = [
  { value: "orders", label: "Orders" },
  { value: "customers", label: "Customers" },
  { value: "inventory", label: "Inventory" },
  { value: "analytics", label: "Analytics" },
  { value: "notifications", label: "Notifications" },
];

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
];

const ROLE_BADGE: Record<string, string> = {
  staff: "bg-brand-50 text-brand-700 border-brand-200",
  manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function permissionsList(p: string): string[] {
  return (p || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function permissionLabel(v: string): string {
  return ALL_PERMISSIONS.find((p) => p.value === v)?.label || v;
}

/* ===== KPI / Info banner ===== */
function InfoBanner() {
  return (
    <Card className="gap-2 border-brand-200/60 p-4 bg-brand-50/30">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-100 text-brand-700">
          <Shield className="h-4 w-4" />
        </div>
        <div className="space-y-1 text-sm">
          <div className="font-semibold text-foreground">Staff Roles & Permissions</div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-brand-700">Staff:</span> orders, customers,
            inventory access. <span className="font-medium text-emerald-700">Manager:</span>{" "}
            all access except billing. Active staff can log in aur apni assigned views
            dekh sakte hain.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ===== Empty state ===== */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* ===== Skeleton ===== */
function StaffSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ===== Staff Form Dialog (Add / Edit) ===== */
function StaffFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  mode: "add" | "edit";
  initial?: StaffMember | null;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("staff");
  const [perms, setPerms] = React.useState<string[]>(["orders", "customers"]);
  const [busy, setBusy] = React.useState(false);

  // Sync form with initial values when dialog opens
  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setName(initial.name);
      setPhone(initial.phone);
      setRole(initial.role || "staff");
      setPerms(permissionsList(initial.permissions));
    } else {
      setName("");
      setPhone("");
      setRole("staff");
      setPerms(["orders", "customers"]);
    }
  }, [open, mode, initial]);

  function togglePerm(v: string) {
    setPerms((prev) =>
      prev.includes(v) ? prev.filter((p) => p !== v) : [...prev, v],
    );
  }

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Naam aur phone dono required hain");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        role,
        permissions: perms.join(","),
      };
      if (mode === "edit" && initial) {
        await api(`/api/staff/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Staff updated", {
          description: `${name} ki details update ho gayi.`,
        });
      } else {
        await api("/api/staff", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Staff added", {
          description: `${name} ko team me add kiya gaya.`,
        });
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error("Save fail", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "edit" ? (
              <Pencil className="h-4 w-4 text-brand-600" />
            ) : (
              <UserPlus className="h-4 w-4 text-brand-600" />
            )}
            {mode === "edit" ? "Edit Staff Member" : "Add Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Staff details update karein aur permissions set karein."
              : "Naya staff member add karein aur permissions assign karein."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Full Name</Label>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayesha Khan"
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Phone</Label>
              <Input
                id="s-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-brand-100 bg-brand-50/20 p-3">
              {ALL_PERMISSIONS.map((p) => {
                const checked = perms.includes(p.value);
                return (
                  <label
                    key={p.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition",
                      checked
                        ? "bg-brand-50 text-brand-700"
                        : "hover:bg-brand-50/60",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => togglePerm(p.value)}
                    />
                    <span>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy}
            className="bg-brand-gradient text-white hover:opacity-90"
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            {mode === "edit" ? "Save Changes" : "Add Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===== Delete confirm dialog ===== */
function DeleteStaffDialog({
  member,
  open,
  onOpenChange,
  onDeleted,
}: {
  member: StaffMember | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);

  async function confirmDelete() {
    if (!member) return;
    setBusy(true);
    try {
      await api(`/api/staff/${member.id}`, { method: "DELETE" });
      toast.success("Staff removed", {
        description: `${member.name} ko team se hata diya gaya.`,
      });
      onOpenChange(false);
      onDeleted();
    } catch (e) {
      toast.error("Delete fail", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-rose-600" />
            Remove Staff Member?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">{member?.name}</span> (
            {member?.phone})? Yeh action undo nahi ho sakta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={busy}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ===== Main View ===== */
export function StaffView() {
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<StaffMember | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<StaffMember | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const fetchStaff = React.useCallback(() => {
    let alive = true;
    setLoading(true);
    api<StaffResponse>("/api/staff")
      .then((r) => {
        if (!alive) return;
        setStaff(r.staff || []);
      })
      .catch((e) => {
        if (!alive) return;
        toast.error("Staff load nahi hui", {
          description: e instanceof Error ? e.message : "",
        });
        setStaff([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const cleanup = fetchStaff();
    return cleanup;
  }, [fetchStaff, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  async function toggleActive(m: StaffMember) {
    setTogglingId(m.id);
    try {
      await api(`/api/staff/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !m.active }),
      });
      toast.success(m.active ? "Staff deactivated" : "Staff activated", {
        description: `${m.name} ab ${m.active ? "inactive" : "active"} hai.`,
      });
      refresh();
    } catch (e) {
      toast.error("Toggle fail", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setTogglingId(null);
    }
  }

  function openEdit(m: StaffMember) {
    setEditTarget(m);
    setEditOpen(true);
  }

  function openDelete(m: StaffMember) {
    setDeleteTarget(m);
    setDeleteOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Staff & Team</h1>
            <Badge
              variant="outline"
              className="border-brand-200 bg-brand-50 text-brand-700"
            >
              {staff.length}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={refresh}
              aria-label="Refresh"
              className="border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Add Staff</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage staff accounts aur permissions.
        </p>
      </div>

      {/* Info banner */}
      <InfoBanner />

      {/* Staff list */}
      {loading ? (
        <StaffSkeleton />
      ) : staff.length === 0 ? (
        <Card className="gap-0 p-6 shadow-none border-brand-100">
          <EmptyState
            message="Abhi koi staff member add nahi. Naya staff add karne ke liye 'Add Staff' press karein."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {staff.map((m) => {
            const perms = permissionsList(m.permissions);
            return (
              <Card
                key={m.id}
                className="border border-brand-100 rounded-lg p-4 shadow-none gap-3 transition hover-lift hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Identity */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase",
                        m.role === "manager"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-brand-100 text-brand-700",
                      )}
                    >
                      {m.name.charAt(0) || "?"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{m.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(ROLE_BADGE[m.role] || "")}
                        >
                          {m.role === "manager" ? "Manager" : "Staff"}
                        </Badge>
                        {m.active ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700"
                          >
                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-border bg-muted text-muted-foreground"
                          >
                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.phone}</div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {perms.length === 0 ? (
                          <span className="text-[11px] italic text-muted-foreground">
                            No permissions assigned
                          </span>
                        ) : (
                          perms.map((p) => (
                            <span
                              key={p}
                              className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                            >
                              {permissionLabel(p)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Active
                      </span>
                      <Switch
                        checked={m.active}
                        onCheckedChange={() => toggleActive(m)}
                        disabled={togglingId === m.id}
                        aria-label={`Toggle ${m.name} active`}
                      />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openEdit(m)}
                      aria-label={`Edit ${m.name}`}
                      className="h-8 w-8 border-brand-200 text-brand-700 hover:bg-brand-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openDelete(m)}
                      aria-label={`Delete ${m.name}`}
                      className="h-8 w-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <StaffFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSaved={refresh}
      />
      <StaffFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initial={editTarget}
        onSaved={refresh}
      />
      <DeleteStaffDialog
        member={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={refresh}
      />
    </div>
  );
}
