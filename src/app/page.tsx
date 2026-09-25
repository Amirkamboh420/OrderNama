"use client";

import { useApp } from "@/lib/store";
import { MarketingHeader } from "@/components/shell/marketing-header";
import { AppSidebar } from "@/components/shell/sidebar";
import { AppTopbar } from "@/components/shell/topbar";
import { MarketingLanding } from "@/components/ordernama/marketing-landing";
import { Dashboard } from "@/components/ordernama/dashboard";
import { OrdersList } from "@/components/ordernama/orders-list";
import { CustomersView } from "@/components/ordernama/customers-view";
import { InventoryView } from "@/components/ordernama/inventory-view";
import { AnalyticsView } from "@/components/ordernama/analytics-view";
import { SettingsView } from "@/components/ordernama/settings-view";
import { PricingView } from "@/components/ordernama/pricing-view";
import { NotificationsView } from "@/components/ordernama/notifications-view";
import { AdminDashboard } from "@/components/ordernama/admin-dashboard";
import { SellerManagement } from "@/components/ordernama/seller-management";
import { SupportView } from "@/components/ordernama/support-view";
import { StaffView } from "@/components/ordernama/staff-view";
import { ContactView } from "@/components/ordernama/contact-view";
import { PublicOrderForm } from "@/components/ordernama/public-order-form";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeManager } from "@/components/shell/theme-manager";
import { KeyboardShortcuts } from "@/components/shell/keyboard-shortcuts";
import { AuthScreen } from "@/components/ordernama/auth-screen";
import { useState } from "react";

export default function Home() {
  const { mode, view, exitApp } = useApp();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

  if (mode === "marketing") {
    if (authMode) {
      return <AuthScreen mode={authMode} onModeChange={setAuthMode} onBack={() => setAuthMode(null)} />;
    }
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <ThemeManager />
        <MarketingHeader onLogin={() => setAuthMode("login")} onRegister={() => setAuthMode("register")} />
        <main className="flex-1">
          <MarketingLanding />
        </main>
      </div>
    );
  }

  // App mode
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#e9eaed] p-0 sm:p-2 lg:p-4">
      <ThemeManager />
      <KeyboardShortcuts />
      <div className="flex min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-900/5 sm:rounded-2xl">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          {/* Sub-header showing how to return to marketing */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={exitApp}
              className="text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to landing
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store className="h-3.5 w-3.5 text-brand-600" />
              <span className="font-medium text-brand-800">Gulbahar Boutique</span>
              <span className="hidden sm:inline">· Pro Plan</span>
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto bg-[#f6f6f8] scrollbar-brand">
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {view === "dashboard" && <Dashboard />}
              {view === "orders" && <OrdersList />}
              {view === "customers" && <CustomersView />}
              {view === "inventory" && <InventoryView />}
              {view === "analytics" && <AnalyticsView />}
              {view === "pricing" && <PricingView />}
              {view === "settings" && <SettingsView />}
              {view === "notifications" && <NotificationsView />}
              {view === "support" && <SupportView />}
              {view === "staff" && <StaffView />}
              {view === "admin-dashboard" && <AdminDashboard />}
              {view === "sellers" && <SellerManagement />}
              {view === "contact" && <ContactView />}
              {view === "order-form" && <PublicOrderForm />}
            </div>

            {/* Sticky footer */}
            <AppFooter />
          </main>
        </div>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-gradient">
            <Store className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-foreground">OrderNama</span>
          <span>· Order tracking for Pakistani sellers 🌿</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>v0.9.0 · Demo</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
