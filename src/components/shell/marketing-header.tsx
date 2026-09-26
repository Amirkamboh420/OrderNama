"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Menu, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export function MarketingHeader({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const router = useRouter();
  const enterApp = useApp((state) => state.enterApp);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/features" className="text-sm font-medium text-muted-foreground transition hover:text-brand-700">Features</Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition hover:text-brand-700">Pricing</Link>
          <Link href="/demo" className="text-sm font-medium text-muted-foreground transition hover:text-brand-700">Demo</Link>
          <Link href="/contact" className="text-sm font-medium text-muted-foreground transition hover:text-brand-700">Contact</Link>
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
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav className="grid gap-1 border-t border-brand-100 bg-white px-6 py-3 md:hidden" aria-label="Main navigation">
          {[["Features", "/features"], ["Pricing", "/pricing"], ["Demo", "/demo"], ["Contact", "/contact"]].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand-50 hover:text-brand-700">{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
