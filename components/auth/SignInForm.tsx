"use client";
import React from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const [email, setEmail] = React.useState(""); 
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) { (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Signed in"}})); window.location.href="/decks"; }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg: res?.error || "Failed"}}));
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="label">Password
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" disabled={loading}>{loading?"Signing in…":"Sign in"}</button>
      </form>
    </div>
  );
}
