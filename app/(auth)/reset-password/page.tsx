"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const email = sp.get("email") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (!token) window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Missing token"}})); }, [token]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (pw.length < 8) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Use 8+ characters"}})); return; }
    if (pw !== pw2) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Passwords do not match"}})); return; }
    setLoading(true);
    const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
    setLoading(false);
    if (r.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Password updated"}})); location.href = "/signin" + (email ? `?email=${encodeURIComponent(email)}` : ""); }
    else { const j = await r.json().catch(()=>({error:"Failed"})); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:j.error || "Reset failed"}})); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <form onSubmit={save} className="card grid gap-3">
        {email && <div className="muted text-sm">Resetting password for <b>{email}</b></div>}
        <label className="label">New password
          <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} required />
        </label>
        <label className="label">Confirm new password
          <input className="input" type="password" value={pw2} onChange={e=>setPw2(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save new password"}</button>
      </form>
    </div>
  );
}
