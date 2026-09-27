"use client";

import { useEffect, useState } from "react";
import { Mail, ShieldCheck, UserRound } from "lucide-react";

type Account = { name: string; email: string; role: string };

export function AccountProfile() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((result: { user?: Account | null }) => setAccount(result.user ?? null))
      .catch(() => setAccount(null));
  }, []);

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Account profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Aapke signed-in account ki maloomat.</p>
      </div>
      <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-brand-100 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white"><UserRound className="h-6 w-6" /></div>
          <div><p className="font-semibold text-foreground">{account?.name || "Loading profile..."}</p><p className="text-sm text-muted-foreground">OrderNama account</p></div>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-50/70 p-4"><dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Mail className="h-4 w-4" /> Email</dt><dd className="mt-2 break-all text-sm font-medium text-foreground">{account?.email || "—"}</dd></div>
          <div className="rounded-xl bg-brand-50/70 p-4"><dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Role</dt><dd className="mt-2 text-sm font-medium capitalize text-foreground">{account?.role || "—"}</dd></div>
        </dl>
      </div>
    </section>
  );
}
