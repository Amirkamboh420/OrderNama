"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { ArrowLeft, BarChart3, Eye, EyeOff, LockKeyhole, Mail, PackageCheck, ShieldCheck, Store, Zap } from "lucide-react";

type AuthMode = "login" | "register";

export function AuthScreen({ mode, onModeChange, onBack }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onBack: () => void }) {
  const router = useRouter();
  const { enterApp, setRole } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitMessage("");
    setSubmitError(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), remember }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Request complete nahi ho saki.");
      setRole("owner");
      enterApp();
      router.replace("/");
    } catch (error) {
      setSubmitError(true);
      setSubmitMessage(error instanceof Error ? error.message : "Network issue. Dobara try karein.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#062519] p-3 sm:p-6 lg:p-8">
      <button onClick={onBack} className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur transition hover:bg-white/15 sm:left-8 sm:top-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </button>

      <section className="auth-card grid w-full max-w-7xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#082b1d] shadow-[0_30px_100px_-35px_rgba(0,0,0,0.7)] lg:min-h-[min(760px,calc(100vh-4rem))] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="auth-welcome relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
          <div className="absolute -left-24 -top-32 h-[34rem] w-[34rem] rounded-full border-[42px] border-white/10" />
          <div className="absolute -bottom-44 -left-48 h-[36rem] w-[36rem] rounded-full border-[54px] border-white/10" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur"><Store className="h-6 w-6" /></div>
            <div><div className="text-xl font-bold tracking-tight">OrderNama</div><div className="text-xs text-white/70">Order SaaS</div></div>
          </div>

          <div className="relative z-10 max-w-sm py-12">
            <p className="mb-3 text-sm font-semibold tracking-wide text-lime-100">{isLogin ? "Welcome back!" : "Your business, better organized."}</p>
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">{isLogin ? <>Good to see<br />you again!</> : <>Make every<br />order count.</>}</h1>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/75">{isLogin ? "Pick up right where you left off and keep your orders moving." : "Join sellers who keep orders, customers, and stock in one simple place."}</p>
          </div>

          <div className="relative z-10 space-y-5">
            <Feature icon={<BarChart3 />} title="Analytics" subtitle="Track real-time performance" />
            <Feature icon={<ShieldCheck />} title="Security" subtitle="Your business data stays protected" />
            <Feature icon={<Zap />} title="Speed" subtitle="Simple tools that keep work flowing" />
          </div>
          <div className="relative z-10 mt-10 text-xs text-white/55">Built for growing Pakistani sellers · © OrderNama</div>
        </aside>

        <div className="auth-form-panel relative flex items-center justify-center px-6 py-14 text-white sm:px-12 lg:px-14 xl:px-20">
          <div className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white sm:right-8 sm:top-8">{isLogin ? "Sign in" : "Create account"}</div>
          <div className="w-full max-w-md">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-300/30"><LockKeyhole className="h-6 w-6" /></div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white">{isLogin ? "Login to your account" : "Create your account"}</h2>
            <p className="mt-2 text-center text-sm text-white/60">{isLogin ? "Enter your credentials to continue" : "Start managing your orders with ease"}</p>

            <form onSubmit={handleSubmit} onChange={() => { setSubmitMessage(""); setSubmitError(false); }} className="mt-8 space-y-5">
              {!isLogin && <label className="block text-sm font-semibold">Full name<input required name="name" autoComplete="name" placeholder="Your name" className="auth-input mt-2" /></label>}
              <label className="block text-sm font-semibold">Email address<div className="auth-field mt-2"><Mail className="h-4 w-4 text-muted-foreground" /><input required name="email" type="email" autoComplete="email" placeholder="Enter your email address" /></div></label>
              <label className="block text-sm font-semibold">Password<div className="auth-field mt-2"><LockKeyhole className="h-4 w-4 text-muted-foreground" /><input required name="password" type={showPassword ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-muted-foreground hover:text-brand-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {isLogin ? <div className="flex items-center justify-between text-xs"><label className="flex cursor-pointer items-center gap-2 text-white/65"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-brand-500" />Remember me</label><a href="mailto:support@ordernama.com?subject=Password%20reset%20request" className="font-medium text-brand-300 hover:underline">Forgot password?</a></div> : <p className="text-xs leading-5 text-white/60">By creating an account, you agree to our <Link href="/terms" className="font-medium text-brand-300 hover:underline">Terms</Link> and <Link href="/privacy" className="font-medium text-brand-300 hover:underline">Privacy Policy</Link>.</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-700/15 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70">{submitting ? "Please wait…" : isLogin ? "Continue" : "Create account"}</button>
              {submitMessage && <p role={submitError ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-center text-xs leading-5 ${submitError ? "border-rose-300/20 bg-rose-200/10 text-rose-100" : "border-brand-300/20 bg-brand-200/10 text-brand-100"}`}>{submitMessage}</p>}
            </form>

            <p className="mt-5 text-center text-xs text-white/45">Want to explore first? <Link href="/demo" className="font-medium text-brand-300 hover:underline">Open the demo</Link></p>
            <p className="mt-7 text-center text-sm text-white/60">{isLogin ? "Don't have an account?" : "Already have an account?"}{" "}<button onClick={() => onModeChange(isLogin ? "register" : "login")} className="font-semibold text-brand-300 hover:underline">{isLogin ? "Sign up" : "Sign in"}</button></p>
            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-white/55"><PackageCheck className="h-3.5 w-3.5 text-brand-400" />Need help? <a href="mailto:support@ordernama.com" className="font-medium text-brand-300 hover:underline">Contact support</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">{icon}</div><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-white/65">{subtitle}</p></div></div>;
}
