/** Tiny fetcher with auto-retry for dev server connection drops. */
export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const maxRetries = 2;
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${path} → ${res.status}: ${txt}`);
      }
      return res.json() as Promise<T>;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      // If this is a network error (server likely restarting), wait + retry
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastErr || new Error("API failed after retries");
}

export function formatPKR(n: number) {
  if (!Number.isFinite(n)) n = 0;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-PK").format(n);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
}

export const STATUS_FLOW = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof STATUS_FLOW)[number];

export const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  Shipped: "bg-purple-100 text-purple-800 border-purple-200",
  Delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export const PAY_STATUS_COLORS: Record<string, string> = {
  Paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Unpaid: "bg-rose-100 text-rose-800 border-rose-200",
  Partial: "bg-amber-100 text-amber-800 border-amber-200",
};
