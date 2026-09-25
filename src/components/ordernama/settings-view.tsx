"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Store,
  MessageCircle,
  FileText,
  Palette,
  CreditCard,
  AlertTriangle,
  Save,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { OrderFormPreviewButton } from "@/components/ordernama/order-form-preview-dialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SettingsResponse = {
  seller: {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    whatsappNumber: string;
    email: string;
    city: string;
    plan: string;
    currency: string;
    romanUrdu: boolean;
  };
  setting: {
    autoConfirm: boolean;
    autoStatusUpdate: boolean;
    lowStockAlert: boolean;
    orderFormSlug: string;
    brandColor: string;
  } | null;
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h3>
      <Separator />
    </div>
  );
}

export function SettingsView() {
  const setView = useApp((s) => s.setView);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [data, setData] = useState<SettingsResponse | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [romanUrdu, setRomanUrdu] = useState(true);

  const [autoConfirm, setAutoConfirm] = useState(true);
  const [autoStatusUpdate, setAutoStatusUpdate] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);

  const [orderFormSlug, setOrderFormSlug] = useState("");
  const [brandColor, setBrandColor] = useState("#1E8C45");

  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<SettingsResponse>("/api/settings");
      setData(res);
      setBusinessName(res.seller.businessName ?? "");
      setOwnerName(res.seller.ownerName ?? "");
      setPhone(res.seller.phone ?? "");
      setWhatsappNumber(res.seller.whatsappNumber ?? "");
      setEmail(res.seller.email ?? "");
      setCity(res.seller.city ?? "");
      setRomanUrdu(res.seller.romanUrdu ?? true);

      if (res.setting) {
        setAutoConfirm(res.setting.autoConfirm);
        setAutoStatusUpdate(res.setting.autoStatusUpdate);
        setLowStockAlert(res.setting.lowStockAlert);
        setOrderFormSlug(res.setting.orderFormSlug ?? "");
        setBrandColor(res.setting.brandColor ?? "#1E8C45");
      }
    } catch (e) {
      toast.error("Settings load nahi hui", { description: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveBusiness() {
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          businessName,
          ownerName,
          whatsappNumber,
          email,
          city,
          romanUrdu,
        }),
      });
      toast.success("Business profile save ho gayi", {
        description: "Changes applied successfully.",
      });
      await load();
    } catch (e) {
      toast.error("Save fail hua", { description: String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWhatsapp(next: {
    autoConfirm: boolean;
    autoStatusUpdate: boolean;
    lowStockAlert: boolean;
  }) {
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      toast.success("WhatsApp automation settings updated", {
        description: "Auto messages will use these rules.",
      });
    } catch (e) {
      toast.error("Save fail hua", { description: String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrderForm() {
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ orderFormSlug }),
      });
      toast.success("Order form link updated", {
        description: "Customers can now use the new link.",
      });
      await load();
    } catch (e) {
      toast.error("Save fail hua", { description: String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBrand() {
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ brandColor }),
      });
      toast.success("Brand color saved", {
        description: "Visual customization applied.",
      });
    } catch (e) {
      toast.error("Save fail hua", { description: String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function copyFormLink() {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/order/${orderFormSlug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Order form link copied!", { description: link });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy fail hua");
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await api("/api/seed", { method: "POST" });
      toast.success("Demo data reset ho gaya", {
        description: "Page reload ho raha hai...",
      });
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error("Reset fail hua", { description: String(e) });
      setResetting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const orderFormLink =
    (typeof window !== "undefined" ? window.location.origin : "") +
    "/order/" +
    (orderFormSlug || "your-slug");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Apne business profile, WhatsApp automation aur brand customization manage karein.
        </p>
      </div>

      <Tabs defaultValue="business" className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* Vertical tabs on mobile = horizontal scroll, desktop = sidebar */}
        <TabsList
          aria-orientation="vertical"
          className="flex h-auto w-full shrink-0 flex-row gap-1 overflow-x-auto rounded-xl bg-brand-50/60 p-1 text-left lg:w-56 lg:flex-col lg:overflow-visible"
        >
          <TabsTrigger
            value="business"
            className="justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Store className="h-4 w-4" /> Business
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="orderform"
            className="justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" /> Order Form
          </TabsTrigger>
          <TabsTrigger
            value="brand"
            className="justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Palette className="h-4 w-4" /> Brand
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="justify-start gap-2 px-3 py-2 text-sm text-rose-700 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <AlertTriangle className="h-4 w-4" /> Danger
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1 space-y-6">
          {/* ---------------- Business Profile ---------------- */}
          <TabsContent value="business" className="space-y-6">
            <Card className="gap-6 p-6">
              <div className="space-y-3">
                <SectionHeading>Business Profile</SectionHeading>
                <p className="text-sm text-muted-foreground">
                  Yeh information customer invoices aur WhatsApp messages mein dikhti hai.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Gulbahar Boutique"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Sana Gulbahar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="0300-1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sana@gulbahar.pk"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karachi"
                  />
                </div>
              </div>

              <Separator />

              {/* Roman Urdu switch */}
              <div className="flex items-center justify-between rounded-lg border border-brand-200/60 p-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-foreground">
                    Roman Urdu interface
                  </div>
                  <p className="text-xs text-muted-foreground">
                    App labels aur WhatsApp templates Roman Urdu (Urdu in English letters) mein
                    dikhao — Pakistan sellers ke liye easy.
                  </p>
                </div>
                <Switch
                  checked={romanUrdu}
                  onCheckedChange={setRomanUrdu}
                  aria-label="Toggle Roman Urdu interface"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBusiness}
                  disabled={saving}
                  className="bg-brand-gradient text-white hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ---------------- WhatsApp Automation ---------------- */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card className="gap-6 p-6">
              <div className="space-y-3">
                <SectionHeading>WhatsApp Automation</SectionHeading>
                <div className="flex items-center gap-2 rounded-lg bg-brand-50/60 px-3 py-2 text-sm">
                  <MessageCircle className="h-4 w-4 text-brand-700" />
                  <span className="text-brand-800">
                    Connected number:&nbsp;
                    <span className="font-semibold">{whatsappNumber || "Not set"}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-brand-200/60 p-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">
                      Auto-confirm new orders
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Naya order banne pe customer ko automatic WhatsApp confirmation message
                      bhejo.
                    </p>
                  </div>
                  <Switch
                    checked={autoConfirm}
                    onCheckedChange={(v) => {
                      setAutoConfirm(v);
                      handleSaveWhatsapp({
                        autoConfirm: v,
                        autoStatusUpdate,
                        lowStockAlert,
                      });
                    }}
                    aria-label="Auto confirm"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-brand-200/60 p-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">
                      Auto status updates
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Order status change hote hi customer ko WhatsApp pe update bhejo
                      (Confirmed, Shipped, Delivered).
                    </p>
                  </div>
                  <Switch
                    checked={autoStatusUpdate}
                    onCheckedChange={(v) => {
                      setAutoStatusUpdate(v);
                      handleSaveWhatsapp({
                        autoConfirm,
                        autoStatusUpdate: v,
                        lowStockAlert,
                      });
                    }}
                    aria-label="Auto status update"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-brand-200/60 p-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">
                      Low stock alerts
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Jab koi item low stock threshold pe pohche to notify karo — notification
                      tab mein dikhega.
                    </p>
                  </div>
                  <Switch
                    checked={lowStockAlert}
                    onCheckedChange={(v) => {
                      setLowStockAlert(v);
                      handleSaveWhatsapp({
                        autoConfirm,
                        autoStatusUpdate,
                        lowStockAlert: v,
                      });
                    }}
                    aria-label="Low stock alert"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Changes auto-save ho jaati hain. Save baad mein undo kar sakte hain.
              </p>
            </Card>
          </TabsContent>

          {/* ---------------- Order Form ---------------- */}
          <TabsContent value="orderform" className="space-y-6">
            <Card className="gap-6 p-6">
              <div className="space-y-3">
                <SectionHeading>Public Order Form</SectionHeading>
                <p className="text-sm text-muted-foreground">
                  Customers is link pe jaake direct order place kar sakte hain — Instagram bio
                  ya WhatsApp pe lagao.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Form slug</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 flex-1 items-center rounded-md border border-brand-200/60 bg-brand-50/40 px-3 text-sm text-muted-foreground">
                      <span className="truncate">{orderFormLink}</span>
                    </div>
                  </div>
                  <Input
                    id="slug"
                    value={orderFormSlug}
                    onChange={(e) =>
                      setOrderFormSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-")
                      )
                    }
                    placeholder="gulbahar-boutique"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only lowercase letters, numbers, aur hyphens allowed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleSaveOrderForm}
                    disabled={saving}
                    className="bg-brand-gradient text-white hover:opacity-90"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Slug
                  </Button>
                  <Button variant="outline" onClick={copyFormLink} className="border-brand-300 text-brand-700 hover:bg-brand-50">
                    {copied ? (
                      <Check className="mr-2 h-4 w-4 text-brand-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy link"}
                  </Button>
                  <OrderFormPreviewButton
                    slug={orderFormSlug}
                    businessName={businessName}
                    whatsappNumber={whatsappNumber}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => window.open(orderFormLink, "_blank")}
                    className="text-muted-foreground"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open form
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ---------------- Brand Customization ---------------- */}
          <TabsContent value="brand" className="space-y-6">
            <Card className="gap-6 p-6">
              <div className="space-y-3">
                <SectionHeading>Brand Customization</SectionHeading>
                <p className="text-sm text-muted-foreground">
                  Customer-facing pages (order form, invoices) ke liye apna brand color choose
                  karein.
                </p>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 rounded-xl border border-border shadow-sm"
                    style={{ background: brandColor }}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">Brand color</div>
                    <code className="text-xs text-muted-foreground">{brandColor}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-md border border-border bg-background p-1"
                    aria-label="Pick brand color"
                  />
                  <Input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-32 font-mono"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {["#1E8C45", "#007542", "#3AA346", "#58BB43", "#78D23D", "#9BE931"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className={`h-9 w-9 rounded-md border-2 transition ${
                      brandColor.toLowerCase() === c.toLowerCase()
                        ? "border-foreground"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                    style={{ background: c }}
                    aria-label={`Pick ${c}`}
                  />
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBrand}
                  disabled={saving}
                  className="bg-brand-gradient text-white hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save color
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ---------------- Billing & Plan ---------------- */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="gap-6 p-6">
              <div className="space-y-3">
                <SectionHeading>Billing &amp; Plan</SectionHeading>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-brand-200/60 bg-brand-50/40 p-5 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current plan
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-foreground">
                      {data.seller.plan}
                    </span>
                    <Badge className="bg-brand-gradient text-white">
                      {data.seller.plan === "Free"
                        ? "Free Tier"
                        : data.seller.plan === "Pro"
                        ? "Pro"
                        : "Business"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Currency: {data.seller.currency} · Next renewal: 30 days
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setView("pricing")}
                  className="border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  Change plan
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground">Monthly cost</div>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {data.seller.plan === "Free"
                      ? "Rs 0"
                      : data.seller.plan === "Pro"
                      ? "Rs 1,200"
                      : "Rs 3,500"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground">Orders limit</div>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {data.seller.plan === "Free"
                      ? "30/mo"
                      : data.seller.plan === "Pro"
                      ? "Unlimited"
                      : "Unlimited"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground">Users</div>
                  <div className="mt-1 text-lg font-bold text-foreground">
                    {data.seller.plan === "Business" ? "Multi" : "1"}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Billing history aur payment methods ke liye{" "}
                <button
                  onClick={() => setView("pricing")}
                  className="font-medium text-brand-700 underline-offset-2 hover:underline"
                >
                  Plans &amp; Billing
                </button>{" "}
                page dekho.
              </p>
            </Card>
          </TabsContent>

          {/* ---------------- Danger Zone ---------------- */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="gap-6 border-rose-200 p-6">
              <div className="space-y-3">
                <SectionHeading>
                  <span className="text-rose-700">Danger Zone</span>
                </SectionHeading>
                <p className="text-sm text-muted-foreground">
                  Yeh actions irreversible hain. Carefully proceed karein.
                </p>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                    <RefreshCw className="h-4 w-4" />
                    Reset demo data
                  </div>
                  <p className="text-xs text-rose-700/80">
                    Sab orders, customers, inventory items aur WhatsApp logs ko original demo seed
                    pe reset kar dega. Real data delete ho jayegi.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={resetting}>
                      {resetting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Reset demo data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                        Reset demo data?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Yeh action undo nahi hoga. Saari current orders, customers, inventory aur
                        WhatsApp logs delete ho jayenge aur fresh demo data reload hoga. Continue
                        karna hai?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReset}
                        className="bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Yes, reset karein
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
