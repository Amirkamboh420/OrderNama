"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

/**
 * Watches the zustand `theme` value and applies/removes the `dark` class
 * on <html>. Also persists to localStorage and restores on mount.
 * Must be mounted once at the app root (page.tsx).
 */
export function ThemeManager() {
  const theme = useApp((s) => s.theme);

  // Restore persisted theme on first mount
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("ordernama-theme")) as
      | "light"
      | "dark"
      | null;
    if (stored && stored !== theme) {
      useApp.setState({ theme: stored });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("ordernama-theme", theme);
    }
  }, [theme]);

  return null;
}
