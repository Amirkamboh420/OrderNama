"use client";

import * as React from "react";
import { Users, UserCheck, Crown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { api, formatPKR } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ------------------------------ types ------------------------------ */

type Segment = {
  tag: string;
  count: number;
  revenue: number;
};

type SegmentsResponse = {
  segments: Segment[];
  totals: {
    new: number;
    repeat: number;
    vip: number;
    total: number;
  };
};

/* ------------------------------ colors ------------------------------ */

// Tone-specific bg/text for known tag dots (matches customers-view tone palette).
const TAG_DOT_COLORS: Record<string, string> = {
  VIP: "bg-amber-500",
  "Repeat Buyer": "bg-emerald-500",
  Wholesale: "bg-purple-500",
  JazzCash: "bg-blue-500",
  "Fast Delivery": "bg-brand-500",
  New: "bg-rose-500",
  Other: "bg-muted-foreground",
};

function dotColor(tag: string): string {
  return TAG_DOT_COLORS[tag] || "bg-brand-400";
}

/* ------------------------------ widget ------------------------------ */

export function CustomerSegmentsWidget() {
  const [data, setData] = React.useState<SegmentsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const fetchSegments = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api<SegmentsResponse>("/api/customers/segments");
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const totals = data?.totals ?? { new: 0, repeat: 0, vip: 0, total: 0 };
  const segments = (data?.segments ?? []).slice(0, 5);
  const newPct = totals.total > 0 ? (totals.new / totals.total) * 100 : 0;
  const repeatPct = totals.total > 0 ? (totals.repeat / totals.total) * 100 : 0;
  const maxCount = segments.reduce((m, s) => Math.max(m, s.count), 0) || 1;

  return (
    <Card className="border border-brand-200/60 transition hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-700" />
          Customer Segments
        </CardTitle>
        <CardDescription>Tag-based customer breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <SegmentsSkeleton />
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load segments. Please retry.
            </p>
          </div>
        ) : totals.total === 0 ? (
          <div className="grid place-items-center py-6 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm font-medium">No customers yet</p>
            <p className="text-xs text-muted-foreground">
              Add customers to see segmentation insights.
            </p>
          </div>
        ) : (
          <>
            {/* Mini-stats: New / Repeat / VIP */}
            <div className="grid grid-cols-3 gap-2">
              <MiniStat
                label="New"
                value={totals.new}
                tone="rose"
                icon={<Users className="h-3.5 w-3.5" />}
              />
              <MiniStat
                label="Repeat"
                value={totals.repeat}
                tone="emerald"
                icon={<UserCheck className="h-3.5 w-3.5" />}
              />
              <MiniStat
                label="VIP"
                value={totals.vip}
                tone="amber"
                icon={<Crown className="h-3.5 w-3.5" />}
              />
            </div>

            {/* Stacked bar: New vs Repeat */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>New vs Repeat</span>
                <span>{totals.total} customers</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex bg-muted">
                <div
                  className="bg-amber-300"
                  style={{ width: `${newPct}%` }}
                  title={`New: ${totals.new}`}
                />
                <div
                  className="bg-brand-gradient"
                  style={{ width: `${repeatPct}%` }}
                  title={`Repeat: ${totals.repeat}`}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  New {Math.round(newPct)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-gradient" />
                  Repeat {Math.round(repeatPct)}%
                </span>
              </div>
            </div>

            {/* Tag segments list */}
            <div className="space-y-2.5">
              {segments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No tag segments yet.
                </p>
              ) : (
                segments.map((s) => {
                  const pct = (s.count / maxCount) * 100;
                  return (
                    <div key={s.tag} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor(s.tag))}
                        />
                        <span className="font-medium truncate flex-1">{s.tag}</span>
                        <span className="text-muted-foreground tabular-nums">{s.count}</span>
                        <span className="text-brand-700 font-semibold tabular-nums text-xs">
                          {formatPKR(s.revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden ml-4">
                        <div
                          className="h-full bg-brand-gradient"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ subcomponents ------------------------------ */

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "rose" | "emerald" | "amber";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return (
    <div className={cn("rounded-lg p-2 text-center", toneClass)}>
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-extrabold tabular-nums leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function SegmentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
