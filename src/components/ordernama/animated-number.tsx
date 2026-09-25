"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated number counter that tweens from 0 to `value` over `duration` ms.
 * Re-runs whenever `value` changes (e.g. after data load).
 */
export function AnimatedNumber({
  value,
  duration = 900,
  format = (n) => String(Math.round(n)),
  className,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startRef.current = null;
    const from = 0;
    const to = value;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(step);
      } else {
        setDisplay(to);
      }
    };
    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted = format(display);
  return <span className={className}>{formatted}</span>;
}

export function AnimatedPKR({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatedNumber
      value={value}
      format={(n) => {
        const v = Math.round(n);
        return "Rs " + v.toLocaleString("en-PK");
      }}
      className={className}
    />
  );
}
