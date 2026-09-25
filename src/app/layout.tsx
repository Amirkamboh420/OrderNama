import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrderNama — Order Management SaaS for Instagram & WhatsApp Sellers",
  description: "Mobile-first order tracking for Pakistan's Instagram & WhatsApp sellers. Orders, customers, inventory, payments, and WhatsApp automation in one place.",
  keywords: ["order management", "WhatsApp orders", "Instagram sellers", "Pakistan", "boutique", "JazzCash", "EasyPaisa", "COD"],
  authors: [{ name: "OrderNama" }],
  openGraph: {
    title: "OrderNama — Order Management SaaS",
    description: "Stop losing orders in Excel. Track orders, customers, delivery & payments in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrderNama — Order Management SaaS",
    description: "Mobile-first order tracking for Instagram & WhatsApp sellers in Pakistan.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
