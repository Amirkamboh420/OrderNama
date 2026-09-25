"use client";

import { create } from "zustand";

export type Role = "owner" | "staff" | "admin" | "customer";

export type ViewKey =
  | "landing"
  | "dashboard"
  | "orders"
  | "customers"
  | "inventory"
  | "analytics"
  | "pricing"
  | "settings"
  | "notifications"
  | "support"
  | "staff"
  | "admin-dashboard"
  | "sellers"
  | "contact"
  | "order-form";

interface AppState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  // app mode: "marketing" shows landing; "app" shows dashboard
  mode: "marketing" | "app";
  enterApp: () => void;
  exitApp: () => void;
  // sidebar open (mobile)
  sidebarOpen: boolean;
  setSidebar: (b: boolean) => void;
  // theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  // role (owner/staff/admin/customer) — controls which views + actions are available
  role: Role;
  setRole: (r: Role) => void;
  // global search query (written by topbar, read by orders list)
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // pending order template (for "create similar order" duplication)
  pendingOrderTemplate: { customerName?: string; customerPhone?: string; items?: { name: string; sku?: string; qty: number; price: number }[]; shipping?: number; discount?: number } | null;
  setPendingOrderTemplate: (t: AppState["pendingOrderTemplate"]) => void;
  // trigger counter — increments when a "new order" action is fired from anywhere (e.g. dashboard quick action, keyboard shortcut)
  newOrderTrigger: number;
  fireNewOrder: () => void;
  // trigger counter — increments when "create similar order" is fired
  duplicateOrderTrigger: number;
  fireDuplicateOrder: () => void;
  // cross-view restock trigger (Notifications → Inventory edit dialog)
  restockItemId: string | null;
  restockTrigger: number;
  fireRestock: (itemId: string) => void;
}

export const useApp = create<AppState>((set) => ({
  view: "landing",
  setView: (v) => set({ view: v }),
  mode: "marketing",
  enterApp: () => set({ mode: "app", view: "dashboard" }),
  exitApp: () => set({ mode: "marketing", view: "landing" }),
  sidebarOpen: false,
  setSidebar: (b) => set({ sidebarOpen: b }),
  theme: "light",
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  role: "owner",
  setRole: (r) => set((s) => {
    // When switching to customer role, go to order-form view
    // When switching to admin, go to admin-dashboard
    // When switching to owner/staff, go to dashboard
    const view: ViewKey = r === "customer" ? "order-form" : r === "admin" ? "admin-dashboard" : "dashboard";
    return { role: r, view };
  }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  pendingOrderTemplate: null,
  setPendingOrderTemplate: (t) => set({ pendingOrderTemplate: t }),
  newOrderTrigger: 0,
  fireNewOrder: () => set((s) => ({ newOrderTrigger: s.newOrderTrigger + 1 })),
  duplicateOrderTrigger: 0,
  fireDuplicateOrder: () => set((s) => ({ duplicateOrderTrigger: s.duplicateOrderTrigger + 1 })),
  restockItemId: null,
  restockTrigger: 0,
  fireRestock: (itemId: string) =>
    set((s) => ({ restockItemId: itemId, restockTrigger: s.restockTrigger + 1 })),
}));

// Role-based permission helper
export function canAccess(role: Role, view: ViewKey): boolean {
  if (role === "admin") {
    // Admin can see admin views + most seller views
    return ["admin-dashboard", "sellers", "support", "contact", "dashboard", "orders", "analytics", "notifications", "settings"].includes(view);
  }
  if (role === "customer") {
    // Customer can only see the public order form + contact
    return ["order-form", "contact", "landing"].includes(view);
  }
  if (role === "staff") {
    // Staff can see orders, customers, inventory, dashboard, notifications, support — but NOT pricing/billing/settings
    return ["dashboard", "orders", "customers", "inventory", "analytics", "notifications", "support"].includes(view);
  }
  // Owner can see everything
  return true;
}
