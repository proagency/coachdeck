"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SignInPage() {
  const sp = useSearchParams();
  const pre = sp.get("email") || "";
  const [email, setEmail] = useState(pre);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (pre) setEmail(pre); }, [pre]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Welcome back!"}})); location.href="/decks"; }
    else { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:res?.error || "Sign in failed"}})); }
  }

  const forgotHref = useMemo(()=> email ? `/forgot?email=${encodeURIComponent(email)}` : "/forgot", [email]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="card grid gap-3">
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="label">Password
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <div className="flex items-center justify-between">
          <a className="underline text-sm" href={forgotHref}>Forgot password?</a>
          <button className="btn-primary" disabled={loading}>{loading?"Signing in...":"Sign in"}</button>
        </div>
      </form>
    </div>
  );
}
