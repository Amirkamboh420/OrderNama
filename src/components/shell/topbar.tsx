"use client";

import { useApp, type ViewKey, type Role } from "@/lib/store";
import { Bell, Languages, Menu, Moon, Search, Sun, UserRound, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  landing: { title: "Welcome", subtitle: "OrderNama â€” orders, customers & payments in one place" },
  dashboard: { title: "Dashboard", subtitle: "Aapke business ka aaj ka haal" },
  orders: { title: "Orders", subtitle: "All customer orders â€” filter, search aur status update" },
  customers: { title: "Customers", subtitle: "Repeat buyers aur naye customers ki list" },
  inventory: { title: "Inventory", subtitle: "Stock levels aur low-stock alerts" },
  analytics: { title: "Analytics", subtitle: "Sales trends, top items aur customer insights" },
  pricing: { title: "Plans & Billing", subtitle: "Free, Pro aur Business plans" },
  settings: { title: "Settings", subtitle: "Business profile, WhatsApp aur order form" },
  profile: { title: "Profile", subtitle: "Aapke account ki maloomat" },
  notifications: { title: "Notifications", subtitle: "Low stock, pending orders aur alerts" },
  support: { title: "Support", subtitle: "Support tickets aur help center" },
  staff: { title: "Staff & Team", subtitle: "Manage staff accounts aur permissions" },
  "admin-dashboard": { title: "Admin Dashboard", subtitle: "Platform-wide stats aur seller overview" },
  sellers: { title: "Seller Management", subtitle: "All registered sellers on the platform" },
  contact: { title: "Contact & Support", subtitle: "Get in touch with us" },
  "order-form": { title: "Order Form", subtitle: "Place your order" },
};

export function AppTopbar() {
  const { view, setSidebar, setView, toggleTheme, theme, searchQuery, setSearchQuery, role, setRole, exitApp } = useApp();
  const [now, setNow] = useState<string>("");
  const [romanUrdu, setRomanUrdu] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [authenticated, setAuthenticated] = useState(false);
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((result: { authenticated?: boolean; user?: { name?: string; role?: string } | null }) => {
        setAuthenticated(Boolean(result.authenticated));
        setAccountName(result.user?.name || "");
        if (result.user?.role && ["owner", "staff", "manager", "admin", "customer"].includes(result.user.role)) {
          setRole(result.user.role as Role);
        }
      })
      .catch(() => setAuthenticated(false));
  }, []);

  async function signOut() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out nahi ho saka.");
      setAuthenticated(false);
      setAccountName("");
      exitApp();
      toast.success("Aap sign out ho gaye.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign out nahi ho saka.");
    }
  }
  const meta = TITLES[view] ?? TITLES.dashboard;

  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleString("en-PK", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);

  // Load romanUrdu preference from seller settings
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api<{ seller: { romanUrdu: boolean } }>("/api/settings");
        if (active && typeof s.seller?.romanUrdu === "boolean") {
          setRomanUrdu(s.seller.romanUrdu);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Debounce local search â†’ store (so orders list can react)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearchQuery]);

  const toggleRomanUrdu = async () => {
    const next = !romanUrdu;
    setRomanUrdu(next);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ romanUrdu: next }),
      });
      toast.success(next ? "Roman Urdu on" : "Roman Urdu off");
    } catch {
      toast.error("Update nahi hua");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-card/95">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          className="rounded-lg p-2 text-muted-foreground hover:bg-brand-50 hover:text-brand-700 md:hidden"
          onClick={() => setSidebar(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{meta.title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>

        {/* Search â€” writes to global store + navigates to orders on Enter */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search orders, customers, inventory... (press /)"
            className="h-9 w-56 pl-9 pr-3 lg:w-72"
            aria-label="Global search"
            onKeyDown={(e) => {
              if (e.key === "Enter" && localSearch.trim()) {
                setView("orders");
                toast.info(`Orders filter: "${localSearch}"`);
              }
            }}
            id="global-search-input"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                setSearchQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <span className="text-xs">âœ•</span>
            </button>
          )}
        </div>

        <div className="hidden items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 ring-1 ring-brand-200 lg:flex dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-status-pulse" />
          {now || "â€”"}
        </div>

        {/* Roman Urdu toggle */}
        <button
          onClick={toggleRomanUrdu}
          className={`hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:flex ${
            romanUrdu
              ? "bg-brand-gradient text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
          }`}
          aria-label="Toggle Roman Urdu"
          title="Roman Urdu interface"
        >
          <Languages className="h-3.5 w-3.5" />
          Ø±
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <button
          onClick={() => setView("notifications")}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background animate-status-pulse" />
        </button>

        {/* Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full bg-brand-gradient px-3 py-1.5 text-white shadow-sm transition hover:shadow-md hover:shadow-brand-600/20"
              aria-label="Account menu"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-[11px] font-bold ring-2 ring-white/40">
                {accountName ? accountName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : role === "admin" ? "AD" : role === "customer" ? "GU" : "HP"}
              </div>
              <span className="hidden text-xs font-semibold sm:inline">
                <span className="block">{accountName || (role === "admin" ? "Admin" : role === "customer" ? "Customer" : "Hira P.")}</span>
                <span className="block text-[9px] font-medium uppercase tracking-wider text-white/75">{role}</span>
              </span>
              <ChevronDown className="hidden h-3 w-3 sm:inline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{accountName || role}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setView("profile")} className="cursor-pointer">
              <UserRound className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView(role === "admin" ? "admin-dashboard" : role === "customer" ? "order-form" : "dashboard")} className="cursor-pointer">
              <LayoutDashboard className="h-4 w-4" /> {role === "customer" ? "My Orders" : "Dashboard"}
            </DropdownMenuItem>
            {authenticated && <DropdownMenuItem onClick={signOut} className="cursor-pointer text-rose-600 focus:text-rose-700">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => exitApp()}
              className="cursor-pointer text-rose-600 focus:text-rose-700"
            >
              <Sun className="h-4 w-4" />
              Back to landing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
