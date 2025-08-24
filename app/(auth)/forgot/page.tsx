"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  const sp = useSearchParams();
  const preset = sp.get("email") || "";
  const [email, setEmail] = useState(preset);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ if (preset) setEmail(preset); }, [preset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false);
    if (r.ok) { setSent(true); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Reset link sent if the email exists"}})); }
    else { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed to send link"}})); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <form onSubmit={submit} className="card grid gap-3">
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={loading || sent}>{loading ? "Sending..." : sent ? "Sent" : "Send reset link"}</button>
      </form>
    </div>
  );
}
