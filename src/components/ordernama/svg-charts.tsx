"use client";

import { useState } from "react";

/* =========================================================================
 *  Lightweight SVG chart components — replacement for recharts to avoid
 *  the heavy dependency that crashes the sandbox dev server (Turbopack
 *  compilation of recharts exceeds the container memory limit).
 *  These are ~150 lines total vs recharts' ~200KB.
 * ======================================================================= */

const BRAND_PRIMARY = "#1E8C45";
const BRAND_LIGHT = "#78D23D";
const BRAND_LIME = "#C1FF1C";

/* ----------------------------- Area Chart -------------------------------- */

type AreaPoint = { label: string; value: number };

export function AreaChart({
  data,
  height = 260,
  color = BRAND_PRIMARY,
  formatValue = (n: number) => String(Math.round(n)),
  formatLabel = (s: string) => s,
  interval = 2,
}: {
  data: AreaPoint[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
  formatLabel?: (s: string) => string;
  interval?: number;
}) {
  const w = 600;
  const h = height;
  const padTop = 10;
  const padRight = 12;
  const padBottom = 28;
  const padLeft = 44;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const range = max - min || 1;
  const step = data.length > 1 ? cw / (data.length - 1) : cw;

  const points = data.map((d, i) => ({
    x: padLeft + i * step,
    y: padTop + ch - ((d.value - min) / range) * ch,
    d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${padLeft + cw} ${padTop + ch} L ${padLeft} ${padTop + ch} Z`;

  // Gridlines (4 horizontal)
  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const y = padTop + (ch / 4) * (i + 1);
    const val = max - (range / 4) * (i + 1);
    return { y, val };
  });

  // X-axis labels (show every `interval`-th)
  const xLabels = data.filter((_, i) => i % interval === 0);

  const [hover, setHover] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} role="img" aria-label="Area chart">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padLeft} y1={g.y} x2={padLeft + cw} y2={g.y} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
          <text x={padLeft - 8} y={g.y + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.5}>
            {formatValue(g.val)}
          </text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#areaFill)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <rect
            x={p.x - step / 2}
            y={padTop}
            width={step}
            height={ch}
            fill="transparent"
            onMouseEnter={() => { setHover(i); }}
            onMouseLeave={() => { setHover(null); }}
          />
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          {hover === i && (
            <g>
              <line x1={p.x} y1={padTop} x2={p.x} y2={padTop + ch} stroke={color} strokeOpacity={0.3} strokeDasharray="2 2" />
              <circle cx={p.x} cy={p.y} r={5} fill={color} stroke="#fff" strokeWidth={2} />
              {/* Tooltip box */}
              <g transform={`translate(${Math.min(Math.max(p.x - 40, padLeft), padLeft + cw - 80)}, ${Math.max(p.y - 48, padTop)})`}>
                <rect width={80} height={36} rx={6} fill="#1a1a1a" fillOpacity={0.9} />
                <text x={40} y={14} textAnchor="middle" fontSize={9} fill="#fff" fillOpacity={0.7}>
                  {p.d.label}
                </text>
                <text x={40} y={28} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700}>
                  {formatValue(p.d.value)}
                </text>
              </g>
            </g>
          )}
        </g>
      ))}
      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const idx = data.indexOf(d);
        const x = padLeft + idx * step;
        return (
          <text key={i} x={x} y={h - 8} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>
            {formatLabel(d.label)}
          </text>
        );
      })}
    </svg>
  );
}

/* ----------------------------- Bar Chart (vertical) ---------------------- */

type BarPoint = { label: string; value: number; color?: string };

export function BarChart({
  data,
  height = 260,
  defaultColor = BRAND_PRIMARY,
  formatValue = (n: number) => String(Math.round(n)),
  formatLabel = (s: string) => s,
  layout = "vertical",
}: {
  data: BarPoint[];
  height?: number;
  defaultColor?: string;
  formatValue?: (n: number) => string;
  formatLabel?: (s: string) => string;
  layout?: "vertical" | "horizontal";
}) {
  const w = 600;
  const h = height;

  if (layout === "horizontal") {
    // Horizontal bars (for status breakdown)
    const padTop = 4;
    const padRight = 16;
    const padBottom = 4;
    const padLeft = 80;
    const cw = w - padLeft - padRight;
    const barH = Math.min(28, (h - padTop - padBottom) / data.length - 4);
    const gap = ((h - padTop - padBottom) - barH * data.length) / Math.max(1, data.length - 1);
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const y = padTop + i * (barH + gap);
          const bw = (d.value / max) * cw;
          return (
            <g key={i}>
              <text x={padLeft - 8} y={y + barH / 2 + 3} textAnchor="end" fontSize={11} fill="currentColor" fillOpacity={0.7}>
                {formatLabel(d.label)}
              </text>
              <rect x={padLeft} y={y} width={cw} height={barH} fill="currentColor" fillOpacity={0.04} rx={4} />
              <rect x={padLeft} y={y} width={Math.max(bw, 2)} height={barH} fill={d.color || defaultColor} rx={4} />
              <text x={padLeft + Math.max(bw, 2) + 6} y={y + barH / 2 + 3} fontSize={11} fill="currentColor" fillOpacity={0.8} fontWeight={600}>
                {formatValue(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Vertical bars
  const padTop = 10;
  const padRight = 12;
  const padBottom = 28;
  const padLeft = 44;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = (cw / data.length) * 0.6;
  const step = cw / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} role="img" aria-label="Bar chart">
      {Array.from({ length: 4 }).map((_, i) => {
        const y = padTop + (ch / 4) * (i + 1);
        const val = max - (max / 4) * (i + 1);
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={padLeft + cw} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
            <text x={padLeft - 8} y={y + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.5}>
              {formatValue(val)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = (d.value / max) * ch;
        const x = padLeft + i * step + (step - barW) / 2;
        const y = padTop + ch - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(bh, 2)} fill={d.color || defaultColor} rx={4} />
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>
              {formatLabel(d.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ----------------------------- Pie / Donut ------------------------------- */

type PieSlice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 200,
  thickness = 32,
}: {
  data: PieSlice[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Compute cumulative offsets without mutation during map
  const cumulative = data.reduce<number[]>((arr, d, i) => {
    const prev = i === 0 ? 0 : arr[i - 1];
    const fraction = d.value / total;
    arr.push(prev + fraction * circumference);
    return arr;
  }, []);
  const slices = data.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    return {
      ...d,
      dash,
      gap: circumference - dash,
      offset: -(i === 0 ? 0 : cumulative[i - 1]),
      pct: Math.round(fraction * 100),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={thickness} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={800} fill="currentColor">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>
          total
        </text>
      </svg>
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="font-medium text-foreground">{s.label}</span>
            <span className="text-muted-foreground">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Composed Chart (bars + line) -------------- */

type ComposedPoint = { label: string; bar: number; line: number };

export function ComposedChart({
  data,
  height = 260,
  barColor = BRAND_LIGHT,
  lineColor = BRAND_PRIMARY,
  formatBar = (n: number) => String(Math.round(n)),
  formatLine = (n: number) => String(Math.round(n)),
  interval = 2,
}: {
  data: ComposedPoint[];
  height?: number;
  barColor?: string;
  lineColor?: string;
  formatBar?: (n: number) => string;
  formatLine?: (n: number) => string;
  interval?: number;
}) {
  const w = 600;
  const h = height;
  const padTop = 10;
  const padRight = 12;
  const padBottom = 28;
  const padLeft = 44;
  const cw = w - padLeft - padRight;
  const ch = h - padTop - padBottom;

  const maxBar = Math.max(...data.map((d) => d.bar), 1);
  const maxLine = Math.max(...data.map((d) => d.line), 1);
  const step = cw / data.length;
  const barW = step * 0.5;

  const linePoints = data.map((d, i) => ({
    x: padLeft + i * step + step / 2,
    y: padTop + ch - (d.line / maxLine) * ch,
  }));
  const linePath = linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const xLabels = data.filter((_, i) => i % interval === 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} role="img" aria-label="Composed chart">
      <defs>
        <linearGradient id="composedLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const y = padTop + (ch / 4) * (i + 1);
        return (
          <line key={i} x1={padLeft} y1={y} x2={padLeft + cw} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3 3" />
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const bh = (d.bar / maxBar) * ch;
        const x = padLeft + i * step + (step - barW) / 2;
        const y = padTop + ch - bh;
        return <rect key={i} x={x} y={y} width={barW} height={Math.max(bh, 2)} fill={barColor} fillOpacity={0.5} rx={3} />;
      })}
      {/* Line area fill */}
      <path d={`${linePath} L ${linePoints[linePoints.length - 1].x} ${padTop + ch} L ${linePoints[0].x} ${padTop + ch} Z`} fill="url(#composedLineFill)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Line dots */}
      {linePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} />
      ))}
      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const idx = data.indexOf(d);
        const x = padLeft + idx * step + step / 2;
        return (
          <text key={i} x={x} y={h - 8} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
