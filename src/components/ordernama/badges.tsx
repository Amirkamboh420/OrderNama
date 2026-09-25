"use client";

import { cn } from "@/lib/utils";
import { STATUS_COLORS, PAY_STATUS_COLORS } from "@/lib/api";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function PayBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        PAY_STATUS_COLORS[status] || "bg-muted text-muted-foreground border-border"
      )}
    >
      {status}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", className)} />;
}
