"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, ArrowUpRight, Menu, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useApp } from "@/lib/store";

const HEADER_GROUPS = [
  { label: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }] },
  { label: "Resources", links: [{ label: "Blog", href: "/blog" }, { label: "Order Form", href: "order-form" }, { label: "Data Export", href: "/data-export" }] },
  { label: "Legal", links: [{ label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" }, { label: "WhatsApp Compliance", href: "/whatsapp-compliance" }] },
];

export function MarketingHeader({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const router = useRouter();
  const enterApp = useApp((state) => state.enterApp);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [orderFormSlug, setOrderFormSlug] = useState("gulbahar-boutique");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((result: { authenticated?: boolean; user?: { name?: string; email?: string; role?: string } | null }) => {
        if (result.authenticated && result.user) {
          setUser({
            name: result.user.name || result.user.email || "Account",
            email: result.user.email || "",
            role: result.user.role || "owner",
          });
          fetch("/api/settings")
            .then((response) => response.ok ? response.json() : null)
            .then((settings: { setting?: { orderFormSlug?: string | null } } | null) => {
              if (settings?.setting?.orderFormSlug) setOrderFormSlug(settings.setting.orderFormSlug);
            })
            .catch(() => undefined);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function signOut() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) setUser(null);
    } catch {
      // Keep the signed-in header visible if the server could not end the session.
    }
  }

  function openDashboard() {
    enterApp();
    router.push("/");
  }

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "";
  const initials = user?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <header className="sticky top-0 z-40 border-b border-brand-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" onClick={(event) => { if (user) { event.preventDefault(); openDashboard(); } }} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-sm">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-foreground">OrderNama</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Order SaaS
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          <Link href="/features" className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-brand-50 hover:text-brand-700">Features</Link>
          <Link href="/pricing" className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-brand-50 hover:text-brand-700">Pricing</Link>
          <Link href="/demo" className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-brand-50 hover:text-brand-700">Demo</Link>
          <Link href="/contact" className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-brand-50 hover:text-brand-700">Contact</Link>
          {HEADER_GROUPS.map((group) => (
            <DropdownMenu key={group.label}>
              <DropdownMenuTrigger asChild>
                <button className="group inline-flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 data-[state=open]:border-brand-200 data-[state=open]:bg-brand-50 data-[state=open]:text-brand-700">
                  {group.label}<ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={10} className="min-w-60 rounded-2xl border-brand-100 bg-white/95 p-2 shadow-xl shadow-brand-950/10 ring-1 ring-brand-900/5 backdrop-blur-xl">
                <div className="mb-1 border-b border-brand-100 px-3 pb-2.5 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{group.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Explore OrderNama</p>
                </div>
                {group.links.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link className="min-h-10 cursor-pointer rounded-xl px-3 py-2 font-medium text-foreground transition-colors focus:bg-brand-50 focus:text-brand-800" href={item.href === "order-form" ? `/order/${orderFormSlug}` : item.href}>
                      <span className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><ArrowUpRight className="h-4 w-4" /></span>
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!authChecked ? <div className="h-9 w-24 animate-pulse rounded-lg bg-brand-50" /> : user ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-white px-2.5 py-1.5 sm:px-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">{initials}</span>
                <span className="leading-tight">
                  <span className="block max-w-28 truncate text-xs font-semibold text-foreground sm:max-w-40">{user.name}</span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-brand-700">{roleLabel}</span>
                </span>
              </div>
              <Button onClick={openDashboard} className="hidden bg-brand-gradient text-white hover:opacity-90 sm:inline-flex">
                <LayoutDashboard className="mr-1.5 h-4 w-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out" className="text-muted-foreground hover:text-rose-600">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onLogin} className="hidden text-brand-700 hover:bg-brand-50 sm:inline-flex">Login</Button>
              <Button onClick={onRegister} className="bg-brand-gradient text-white hover:opacity-90">Try Free <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav className="grid gap-4 border-t border-brand-100 bg-white px-6 py-4 xl:hidden" aria-label="Main navigation">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {[["Features", "/features"], ["Pricing", "/pricing"], ["Demo", "/demo"], ["Contact", "/contact"]].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">{label}</Link>
            ))}
          </div>
          <div className="grid gap-4 border-t border-brand-100 pt-3 sm:grid-cols-3">
            {HEADER_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                <div className="grid gap-0.5">
                  {group.links.map((item) => (
                    <Link key={item.label} href={item.href === "order-form" ? `/order/${orderFormSlug}` : item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-brand-50 hover:text-brand-700">{item.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
