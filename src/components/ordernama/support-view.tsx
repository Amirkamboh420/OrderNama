"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Headphones,
  Ticket,
  Plus,
  Send,
  MessageSquare,
  Loader2,
  RefreshCw,
  Inbox,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

import { api, timeAgo } from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";

/* ===== Types ===== */
type TicketResponse = {
  from: "seller" | "admin" | string;
  message: string;
  at: string;
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  responses: TicketResponse[];
  createdAt: string;
  updatedAt: string;
};

type TicketsResponse = { tickets: Ticket[]; count: number };

/* ===== Constants ===== */
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All categories" },
  { value: "general", label: "General" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "feature", label: "Feature Request" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_FLOW = ["open", "in_progress", "resolved", "closed"] as const;

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  urgent: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  billing: "Billing",
  technical: "Technical",
  feature: "Feature Request",
};

function statusLabel(s: string) {
  return s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);
}

/* ===== KPI Card ===== */
function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "blue" | "emerald";
}) {
  const toneClasses: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50/60 text-amber-700",
    blue: "border-blue-200 bg-blue-50/60 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
  };
  return (
    <Card className="border border-brand-200/60 p-4 sm:p-5 transition hover-lift hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border",
            toneClasses[tone],
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-foreground">{value}</div>
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
function TicketsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ===== New Ticket Dialog ===== */
function NewTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated: () => void;
}) {
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState("general");
  const [priority, setPriority] = React.useState("normal");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function reset() {
    setSubject("");
    setCategory("general");
    setPriority("normal");
    setMessage("");
  }

  async function submit() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject aur message dono required hain");
      return;
    }
    setBusy(true);
    try {
      await api("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          message: message.trim(),
        }),
      });
      toast.success("Ticket ban gayi!", {
        description: "Hum jald reply karenge.",
      });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast.error("Ticket create nahi hui", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-600" />
            New Support Ticket
          </DialogTitle>
          <DialogDescription>
            Apna sawal ya masla submit karein — team jald reply karegi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-subject">Subject</Label>
            <Input
              id="t-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of issue"
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-message">Message</Label>
            <Textarea
              id="t-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Apne masle ka tafseeli bayan likhein…"
              rows={5}
            />
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
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            Submit Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===== Ticket Detail Dialog ===== */
function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
  onUpdated,
}: {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onUpdated: () => void;
}) {
  const [reply, setReply] = React.useState("");
  const [busyReply, setBusyReply] = React.useState(false);
  const [busyStatus, setBusyStatus] = React.useState<string | null>(null);

  // Reset reply when ticket changes
  React.useEffect(() => {
    setReply("");
  }, [ticket?.id]);

  if (!ticket) return null;

  async function sendReply() {
    if (!ticket) return;
    if (!reply.trim()) {
      toast.error("Reply khali nahi ho sakti");
      return;
    }
    setBusyReply(true);
    try {
      await api(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ response: reply.trim(), from: "seller" }),
      });
      toast.success("Reply bhej di");
      setReply("");
      onUpdated();
    } catch (e) {
      toast.error(" Reply bhejna fail", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusyReply(false);
    }
  }

  async function changeStatus(s: string) {
    if (!ticket) return;
    setBusyStatus(s);
    try {
      await api(`/api/support/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: s }),
      });
      toast.success(`Status: ${statusLabel(s)}`);
      onUpdated();
    } catch (e) {
      toast.error(" Status update fail", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusyStatus(null);
    }
  }

  const responses = ticket.responses || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3 pr-8">
            <span className="flex-1">{ticket.subject}</span>
            <Badge
              variant="outline"
              className={cn("shrink-0", STATUS_BADGE[ticket.status] || "")}
            >
              {statusLabel(ticket.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className={cn(PRIORITY_BADGE[ticket.priority] || "")}
            >
              {ticket.priority} priority
            </Badge>
            <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
              {CATEGORY_LABEL[ticket.category] || ticket.category}
            </Badge>
            <span className="text-muted-foreground">
              Created {timeAgo(ticket.createdAt)} • Updated {timeAgo(ticket.updatedAt)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Conversation thread */}
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-brand pr-1">
          {/* Original message — always shown as seller (left) */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg rounded-bl-sm bg-brand-50 border border-brand-100 p-3">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-brand-700">
                <MessageSquare className="h-3 w-3" />
                You (original)
                <span className="font-normal text-muted-foreground">
                  {timeAgo(ticket.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {ticket.message}
              </p>
            </div>
          </div>

          {responses
            .filter((r, i) => i === 0 && r.message === ticket.message ? false : true)
            .map((r, i) => {
              const isSeller = r.from === "seller";
              return (
                <div
                  key={i}
                  className={cn("flex", isSeller ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 border",
                      isSeller
                        ? "rounded-bl-sm bg-brand-50 border-brand-100"
                        : "rounded-br-sm bg-emerald-50 border-emerald-200",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 flex items-center gap-2 text-[11px] font-semibold",
                        isSeller ? "text-brand-700" : "text-emerald-700",
                      )}
                    >
                      {isSeller ? "You" : "Support"}
                      <span className="font-normal text-muted-foreground">
                        {timeAgo(r.at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {r.message}
                    </p>
                  </div>
                </div>
              );
            })}
          {responses.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">
              No replies yet. Apna pehla reply bhejein.
            </p>
          )}
        </div>

        <Separator />

        {/* Status actions */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Update Status
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => {
              const active = ticket.status === s;
              return (
                <Button
                  key={s}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  disabled={busyStatus === s}
                  onClick={() => changeStatus(s)}
                  className={cn(
                    active
                      ? "bg-brand-gradient text-white hover:opacity-90"
                      : "border-brand-200 text-brand-700 hover:bg-brand-50",
                  )}
                >
                  {busyStatus === s ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : active ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : null}
                  {statusLabel(s)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Reply box */}
        <div className="space-y-2">
          <Label htmlFor="reply">Reply</Label>
          <Textarea
            id="reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Apna reply likhein…"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={sendReply}
              disabled={busyReply || !reply.trim()}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {busyReply ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Send Reply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===== Main View ===== */
export function SupportView() {
  const [status, setStatus] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [newOpen, setNewOpen] = React.useState(false);
  const [detailTicket, setDetailTicket] = React.useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const fetchTickets = React.useCallback(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    api<TicketsResponse>(`/api/support/tickets?${params.toString()}`)
      .then((r) => {
        if (!alive) return;
        setTickets(r.tickets || []);
      })
      .catch((e) => {
        if (!alive) return;
        toast.error("Tickets load nahi hui", {
          description: e instanceof Error ? e.message : "",
        });
        setTickets([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status]);

  React.useEffect(() => {
    const cleanup = fetchTickets();
    return cleanup;
  }, [fetchTickets, refreshKey]);

  // Apply category filter client-side (API only filters by status)
  const visibleTickets = tickets.filter(
    (t) => category === "all" || t.category === category,
  );

  function openDetail(t: Ticket) {
    setDetailTicket(t);
    setDetailOpen(true);
  }

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  // KPI counts
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Headphones className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Support</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Apne tickets dekhein, naya sawal poochein, aur support team se baat karein.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={<Ticket className="h-4 w-4" />}
          label="Open Tickets"
          value={openCount}
          tone="amber"
        />
        <KpiCard
          icon={<CircleDot className="h-4 w-4" />}
          label="In Progress"
          value={inProgressCount}
          tone="blue"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Resolved"
          value={resolvedCount}
          tone="emerald"
        />
      </div>

      {/* Filter bar */}
      <Card className="gap-0 p-4 shadow-none border-brand-100 bg-brand-50/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={refresh}
              aria-label="Refresh"
              className="shrink-0 border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
            <Button
              onClick={() => setNewOpen(true)}
              className="shrink-0 bg-brand-gradient text-white hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Loading…
              </span>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {visibleTickets.length}
                </span>{" "}
                {visibleTickets.length === 1 ? "ticket" : "tickets"} found
              </>
            )}
          </span>
          {(status !== "all" || category !== "all") && (
            <button
              type="button"
              onClick={() => {
                setStatus("all");
                setCategory("all");
              }}
              className="text-brand-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Ticket list */}
      {loading ? (
        <TicketsSkeleton />
      ) : visibleTickets.length === 0 ? (
        <Card className="gap-0 p-6 shadow-none border-brand-100">
          <EmptyState
            message={
              status !== "all" || category !== "all"
                ? "Is filter se koi ticket match nahi karti."
                : "Abhi koi support ticket nahi. Naya ticket banane ke liye 'New Ticket' press karein."
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {visibleTickets.map((t) => (
            <Card
              key={t.id}
              onClick={() => openDetail(t)}
              className="border border-brand-100 rounded-lg p-4 hover:bg-brand-50/40 cursor-pointer transition gap-2 shadow-none"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {t.subject}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className="border-brand-200 bg-brand-50 text-brand-700"
                    >
                      {CATEGORY_LABEL[t.category] || t.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(PRIORITY_BADGE[t.priority] || "")}
                    >
                      {t.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(STATUS_BADGE[t.status] || "")}
                    >
                      {statusLabel(t.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {t.message}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-muted-foreground sm:w-44">
                  <div>Created {timeAgo(t.createdAt)}</div>
                  <div>Updated {timeAgo(t.updatedAt)}</div>
                  <div className="mt-1">
                    {(t.responses?.length || 0)} repl
                    {(t.responses?.length || 0) === 1 ? "y" : "ies"}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <NewTicketDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={refresh}
      />
      <TicketDetailDialog
        ticket={detailTicket}
        open={detailOpen}
        onOpenChange={(b) => {
          setDetailOpen(b);
          if (!b) refresh();
        }}
        onUpdated={refresh}
      />
    </div>
  );
}
