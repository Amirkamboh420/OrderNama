"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/lib/store";
import { ArrowLeft, BarChart3, Eye, EyeOff, LockKeyhole, Mail, PackageCheck, ShieldCheck, Store, Zap } from "lucide-react";

type AuthMode = "login" | "register";

export function AuthScreen({ mode, onModeChange, onBack }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onBack: () => void }) {
  const { enterApp } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const isLogin = mode === "login";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    enterApp();
  }

  return (
    <main className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-50/60 p-4 sm:p-8">
      <button onClick={onBack} className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-sm font-medium text-brand-800 shadow-sm transition hover:bg-brand-50 sm:left-8 sm:top-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </button>

      <section className="auth-card grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_-35px_rgba(13,82,44,0.32)] lg:min-h-[690px] lg:grid-cols-[0.9fr_1.1fr]">
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

        <div className="relative flex items-center justify-center px-6 py-14 sm:px-12 lg:px-14 xl:px-20">
          <div className="absolute right-6 top-6 rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-800 sm:right-8 sm:top-8">{isLogin ? "Sign in" : "Create account"}</div>
          <div className="w-full max-w-md">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><LockKeyhole className="h-6 w-6" /></div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">{isLogin ? "Login to your account" : "Create your account"}</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">{isLogin ? "Enter your credentials to continue" : "Start managing your orders with ease"}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {!isLogin && <label className="block text-sm font-semibold">Full name<input required autoComplete="name" placeholder="Your name" className="auth-input mt-2" /></label>}
              <label className="block text-sm font-semibold">Email address<div className="auth-field mt-2"><Mail className="h-4 w-4 text-muted-foreground" /><input required type="email" autoComplete="email" placeholder="Enter your email address" /></div></label>
              <label className="block text-sm font-semibold">Password<div className="auth-field mt-2"><LockKeyhole className="h-4 w-4 text-muted-foreground" /><input required type={showPassword ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-muted-foreground hover:text-brand-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {isLogin ? <div className="flex items-center justify-between text-xs"><label className="flex cursor-pointer items-center gap-2 text-muted-foreground"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-brand-700" />Remember me</label><button type="button" className="font-medium text-brand-700 hover:underline">Forgot password?</button></div> : <p className="text-xs leading-5 text-muted-foreground">By creating an account, you agree to our <a href="#terms" className="font-medium text-brand-700 hover:underline">Terms</a> and <a href="#privacy" className="font-medium text-brand-700 hover:underline">Privacy Policy</a>.</p>}
              <button type="submit" className="w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-700/15 transition hover:brightness-105 active:scale-[0.99]">{isLogin ? "Continue" : "Create account"}</button>
            </form>

            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or</span><span className="h-px flex-1 bg-border" /></div>
            <button type="button" className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:bg-brand-50/60"><GoogleMark />Continue with Google</button>
            <p className="mt-7 text-center text-sm text-muted-foreground">{isLogin ? "Don't have an account?" : "Already have an account?"}{" "}<button onClick={() => onModeChange(isLogin ? "register" : "login")} className="font-semibold text-brand-700 hover:underline">{isLogin ? "Sign up" : "Sign in"}</button></p>
            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><PackageCheck className="h-3.5 w-3.5 text-brand-600" />Need help? <a href="mailto:support@ordernama.com" className="font-medium text-brand-700 hover:underline">Contact support</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">{icon}</div><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-white/65">{subtitle}</p></div></div>;
}

function GoogleMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="h-4 w-4"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#4A90E2" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.6 19.6 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"/></svg>;
}
