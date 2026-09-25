"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

/**
 * OrderNama brand palette — greens → lime.
 * Used to colour each confetti piece.
 */
const BRAND_COLORS = [
  "#1E8C45",
  "#3AA346",
  "#58BB43",
  "#78D23D",
  "#9BE931",
  "#C1FF1C",
] as const;

type ConfettiPiece = {
  left: number; // vw% horizontal start
  color: string; // brand color
  delay: number; // s
  duration: number; // s, 2–4
  rotation: number; // deg, initial spin offset
};

const PIECE_COUNT = 30;

/**
 * Build a stable set of confetti pieces.
 * Memoised so the random values don't churn on re-render.
 */
function buildPieces(): ConfettiPiece[] {
  return Array.from({ length: PIECE_COUNT }, () => ({
    left: Math.random() * 100,
    color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 2,
    rotation: Math.random() * 360,
  }));
}

/**
 * Lightweight CSS-only confetti burst.
 *
 * Renders nothing when `show` is false. When `show` is true, ~30 absolutely
 * positioned coloured divs fall from the top of the viewport with random
 * horizontal offsets, rotation and animation timing. The parent component
 * is responsible for unmounting (e.g. via a `setTimeout` to set `show=false`
 * after ~4s).
 *
 * Pointer-events are disabled so the burst never blocks the UI underneath.
 */
export function Confetti({ show }: { show: boolean }) {
  const pieces = useMemo(() => buildPieces(), []);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
      role="presentation"
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece h-3 w-2"
          style={
            {
              left: `${p.left}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--rot": `${p.rotation}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
