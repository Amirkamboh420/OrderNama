"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Target, Trophy, Pencil, TrendingUp } from "lucide-react";
import { api, formatPKR } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SettingsResponse = {
  seller: Record<string, unknown>;
  setting: {
    monthlyGoal: number;
  } & Record<string, unknown> | null;
};

type StatsResponse = {
  monthRevenue: number;
} & Record<string, unknown>;

const DEFAULT_GOAL = 100000;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function clampPct(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function MonthlyGoalWidget() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL);
  const [revenue, setRevenue] = useState<number>(0);
  const [editOpen, setEditOpen] = useState(false);
  const [draftGoal, setDraftGoal] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, stats] = await Promise.all([
        api<SettingsResponse>("/api/settings"),
        api<StatsResponse>("/api/stats"),
      ]);
      const g = Number(settings.setting?.monthlyGoal);
      setGoal(Number.isFinite(g) && g > 0 ? g : DEFAULT_GOAL);
      setRevenue(Number(stats.monthRevenue) || 0);
    } catch {
      // Swallow — widget should fail quietly.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pct = clampPct(goal > 0 ? (revenue / goal) * 100 : 0);
  const achieved = goal > 0 && revenue >= goal;
  const remaining = Math.max(0, goal - revenue);
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  function openEdit() {
    setDraftGoal(String(goal || ""));
    setEditOpen(true);
  }

  async function saveGoal() {
    const n = Number(draftGoal);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Please enter an amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ monthlyGoal: n }),
      });
      setGoal(n);
      setEditOpen(false);
      toast.success("Monthly goal updated!");
      await load();
    } catch {
      toast.error("Could not save goal. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border border-brand-200/60 p-4 sm:p-5 transition hover:shadow-md gap-4">
      <CardHeader className="p-0 flex-row items-center gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Target className="h-4 w-4" />
          </span>
          <CardTitle className="text-base">Monthly Goal</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1 px-2 text-xs text-brand-700 hover:bg-brand-50 hover:text-brand-700"
          onClick={openEdit}
        >
          <Pencil className="h-3 w-3" />
          Edit goal
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <Skeleton className="h-[120px] w-[120px] rounded-full sm:h-[140px] sm:w-[140px]" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1">
            {/* Progress ring */}
            <div className="relative inline-flex items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="h-[120px] w-[120px] sm:h-[140px] sm:w-[140px]"
                role="img"
                aria-label={`Monthly goal ${Math.round(pct)}% achieved`}
              >
                <defs>
                  <linearGradient id="goalGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1E8C45" />
                    <stop offset="50%" stopColor="#58BB43" />
                    <stop offset="100%" stopColor="#9BE931" />
                  </linearGradient>
                </defs>
                {/* Background track */}
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="oklch(0.93 0.02 145)"
                  strokeWidth="10"
                />
                {/* Foreground arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="url(#goalGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 60 60)"
                  style={{
                    transition: "stroke-dashoffset 700ms ease-out",
                  }}
                />
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-brand-gradient leading-none">
                  {Math.round(pct)}%
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  achieved
                </span>
              </div>
            </div>

            {/* Revenue of goal */}
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatPKR(revenue)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {formatPKR(goal)}
              </span>
            </p>

            {/* Remaining or achieved */}
            {achieved ? (
              <div className="flex flex-col items-center gap-1.5">
                <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  <Trophy className="h-3.5 w-3.5" />
                  🎉 Goal achieved!
                </Badge>
                <p className="flex items-center gap-1 text-xs text-emerald-700">
                  <span className="font-semibold">{formatPKR(remaining)}</span>
                  <span className="text-emerald-700/70">to go</span>
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-1 text-xs text-brand-700">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-semibold">{formatPKR(remaining)}</span>
                <span className="text-muted-foreground">to go</span>
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit goal dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set monthly goal</DialogTitle>
            <DialogDescription>
              Enter the revenue target you want to hit this month (in PKR).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="monthly-goal-input">Monthly goal (PKR)</Label>
            <Input
              id="monthly-goal-input"
              type="number"
              min={0}
              value={draftGoal}
              onChange={(e) => setDraftGoal(e.target.value)}
              placeholder="e.g. 100000"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveGoal();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveGoal}
              disabled={saving}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
