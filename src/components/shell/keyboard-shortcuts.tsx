"use client";

import { useEffect, useState } from "react";
import { useApp, type ViewKey } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * KeyboardShortcuts
 * Mounts a single `keydown` listener on `window` and dispatches app-wide
 * shortcuts (navigate views, new order, focus global search, help dialog).
 *
 * Returns an empty fragment unless the help dialog is open, in which case
 * the shadcn Dialog is rendered.
 */

const VIEW_KEYS: Record<string, ViewKey> = {
  "1": "dashboard",
  "2": "orders",
  "3": "customers",
  "4": "inventory",
  "5": "analytics",
  "6": "pricing",
  "7": "notifications",
  "8": "settings",
};

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "n", description: "Create new order" },
  { keys: "/", description: "Focus search" },
  { keys: "1", description: "Go to Dashboard" },
  { keys: "2", description: "Go to Orders" },
  { keys: "3", description: "Go to Customers" },
  { keys: "4", description: "Go to Inventory" },
  { keys: "5", description: "Go to Analytics" },
  { keys: "6", description: "Go to Pricing" },
  { keys: "7", description: "Go to Notifications" },
  { keys: "8", description: "Go to Settings" },
  { keys: "?", description: "Show this help" },
  { keys: "Esc", description: "Close dialog" },
];

export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  const setView = useApp((s) => s.setView);
  const fireNewOrder = useApp((s) => s.fireNewOrder);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? "";
      const inEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (t?.isContentEditable ?? false);

      // "/" is the one exception — it always fires (even while typing in an
      // input) and focuses the global search input. Skip if we're already
      // inside the search box so the user can actually type a slash there.
      if (e.key === "/" && t?.id !== "global-search-input") {
        e.preventDefault();
        const el = document.getElementById(
          "global-search-input",
        ) as HTMLInputElement | null;
        if (el) {
          el.focus();
          if (typeof el.select === "function") el.select();
        }
        return;
      }

      // All other shortcuts are ignored when typing in an editable element.
      if (inEditable) return;

      // "?" (Shift+/) toggles the help dialog.
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((o) => !o);
        return;
      }

      if (e.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        return;
      }

      if (e.key === "n" || e.key === "N") {
        fireNewOrder();
        setView("orders");
        return;
      }

      if (e.key in VIEW_KEYS) {
        setView(VIEW_KEYS[e.key]);
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen, setView, fireNewOrder]);

  if (!helpOpen) return <></>;

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keys anywhere in the app to navigate faster.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center gap-2 text-sm"
            >
              <kbd className="rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-xs font-mono text-brand-800">
                {s.keys}
              </kbd>
              <span className="text-muted-foreground">{s.description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
