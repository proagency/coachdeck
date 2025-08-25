// app/(auth)/reset-password/page.tsx
"use client";
import React from "react";

export const metadata = { title: "Reset Password — CoachDeck" };

export default function ResetPasswordPage() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (r.ok) {
      // go to /signin with the email prefilled as requested
      const u = new URL("/signin", window.location.origin);
      u.searchParams.set("email", email);
      window.location.href = u.toString();
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Reset failed");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="hidden" value={token} />
        <label className="label">New Password
          <input className="input" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} />
        </label>
        <button className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" disabled={loading}>
          {loading ? "Saving…" : "Save New Password"}
        </button>
      </form>
      <div className="text-sm muted">After saving, you’ll be redirected to sign in, with your email pre-filled.</div>
    </div>
  );
}
