"use client";

import Link from "next/link";
import { useApp, canAccess, type ViewKey, type Role } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  Home,
  Store,
  X,
  Headphones,
  UserCog,
  Shield,
  Building2,
  Mail,
  FileText,
} from "lucide-react";

const ALL_NAV: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }>; hint?: string; section: string }[] = [
  // Owner/Staff section
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "manage" },
  { key: "orders", label: "Orders", icon: ShoppingBag, hint: "Manage all orders", section: "manage" },
  { key: "customers", label: "Customers", icon: Users, section: "manage" },
  { key: "inventory", label: "Inventory", icon: Package, section: "manage" },
  { key: "analytics", label: "Analytics", icon: BarChart3, section: "manage" },
  { key: "notifications", label: "Notifications", icon: Bell, section: "manage" },
  { key: "support", label: "Support", icon: Headphones, section: "manage" },
  { key: "staff", label: "Staff & Team", icon: UserCog, section: "manage" },
  // Owner-only section
  { key: "pricing", label: "Plans & Billing", icon: CreditCard, section: "owner" },
  { key: "settings", label: "Settings", icon: Settings, section: "owner" },
  // Admin section
  { key: "admin-dashboard", label: "Admin Dashboard", icon: Shield, section: "admin" },
  { key: "sellers", label: "Seller Management", icon: Building2, section: "admin" },
  // Public section
  { key: "contact", label: "Contact / Support", icon: Mail, section: "public" },
  { key: "order-form", label: "Order Form", icon: FileText, section: "public" },
];

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  staff: "Staff",
  admin: "Admin",
  customer: "Customer",
};

export function AppSidebar() {
  const { view, setView, sidebarOpen, setSidebar, role } = useApp();

  // Filter nav items based on role
  const navItems = ALL_NAV.filter((item) => canAccess(role, item.key));

  // Group by section
  const sections: { name: string; items: typeof navItems }[] = [];
  if (role === "admin") {
    sections.push({ name: "Admin", items: navItems.filter((i) => i.section === "admin") });
    sections.push({ name: "Seller Overview", items: navItems.filter((i) => i.section === "manage") });
  } else if (role === "customer") {
    sections.push({ name: "Customer", items: navItems.filter((i) => i.section === "public") });
  } else {
    const manageItems = navItems.filter((i) => i.section === "manage");
    if (manageItems.length) sections.push({ name: "Manage", items: manageItems });
    if (role === "owner") {
      const ownerItems = navItems.filter((i) => i.section === "owner");
      if (ownerItems.length) sections.push({ name: "Account", items: ownerItems });
    }
    const publicItems = navItems.filter((i) => i.section === "public");
    if (publicItems.length) sections.push({ name: "Help", items: publicItems });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 md:static md:w-[76px] md:translate-x-0 dark:border-slate-800 dark:bg-card",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-5 py-4 md:justify-center md:px-2">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 md:justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient shadow-sm shadow-brand-700/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight md:hidden">
                <div className="text-base font-bold tracking-tight text-slate-900 dark:text-foreground">OrderNama</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground">
                  {role === "admin" ? "Admin Panel" : role === "customer" ? "Customer" : "Gulbahar Boutique"}
                </div>
              </div>
            </Link>
            <button
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
              onClick={() => setSidebar(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick action — only for owner/staff */}
          {role !== "admin" && role !== "customer" && (
            <div className="px-4 py-4 md:px-3 md:py-3">
              <button
                onClick={() => {
                  setView("orders");
                  setSidebar(false);
                }}
                title="New Order"
                aria-label="New Order"
                className="group flex w-full items-center gap-2 rounded-xl bg-brand-gradient px-3.5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:shadow-lg hover:shadow-brand-600/30 md:justify-center md:px-0 md:py-3"
              >
                <Home className="h-4 w-4" />
                <span className="md:hidden">New Order</span>
              </button>
            </div>
          )}

          {/* Role badge */}
          <div className="px-4 pb-2 md:hidden">
            <div className="flex items-center gap-2 rounded-lg bg-brand-50/60 px-3 py-1.5 dark:bg-brand-900/20">
              <Shield className="h-3.5 w-3.5 text-brand-600" />
              <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                Logged in as {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-brand md:px-2">
            {sections.map((section) => (
              <div key={section.name}>
                <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                  {section.name}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.key;
                  return (
                    <button
                      key={item.key}
                      title={item.label}
                      aria-label={item.label}
                      onClick={() => {
                        setView(item.key);
                        setSidebar(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition md:justify-center md:px-0 md:py-3",
                        active
                          ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800"
                          : "text-muted-foreground hover:bg-brand-50/60 hover:text-brand-800 dark:hover:bg-brand-900/20"
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground/80")} />
                      <span className="flex-1 text-left md:hidden">{item.label}</span>
                      {item.hint && (
                        <span className="hidden text-[10px] text-muted-foreground lg:block md:hidden">{item.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom plan card — only for owner */}
          {role === "owner" && (
            <div className="border-t border-brand-200/60 p-4 dark:border-brand-800/60 md:hidden">
              <div className="rounded-xl bg-brand-gradient-soft p-3 ring-1 ring-brand-200/60 dark:ring-brand-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-800 dark:text-brand-300">Pro Plan</span>
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Active</span>
                </div>
                <p className="mt-1 text-[11px] text-brand-700/80 dark:text-brand-400/80">Unlimited orders · WhatsApp automation</p>
                <button
                  onClick={() => setView("pricing")}
                  className="mt-2 w-full rounded-lg border border-brand-300 bg-white/60 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:bg-white dark:bg-transparent dark:text-brand-300"
                >
                  Manage Plan
                </button>
              </div>
            </div>
          )}
          {role === "owner" && (
            <button
              type="button"
              onClick={() => setView("pricing")}
              title="Plans & Billing"
              aria-label="Plans & Billing"
              className="mx-auto mb-3 hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 md:flex"
            >
              <CreditCard className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
