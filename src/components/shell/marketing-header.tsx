"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHeader({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-brand-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
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
          <Button variant="ghost" onClick={onLogin} className="hidden text-brand-700 hover:bg-brand-50 sm:inline-flex">
            Login
          </Button>
          <Button onClick={onRegister} className="bg-brand-gradient text-white hover:opacity-90">
            Try Free <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
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
