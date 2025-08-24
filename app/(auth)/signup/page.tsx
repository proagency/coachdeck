"use client";
import { useState } from "react";

export default function SignUpPage(){
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/auth/register", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, name, password }) });
    setBusy(false);
    if (r.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Submitted for approval"}})); location.href="/signin?email="+encodeURIComponent(email); }
    else { const j = await r.json().catch(()=>({error:"Failed"})); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:j.error||"Failed"}})); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Coach sign up</h1>
      <p className="muted text-sm">Super Admin approval is required before you can sign in.</p>
      <form onSubmit={onSubmit} className="card grid gap-3">
        <label className="label">Full name
          <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        </label>
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="label">Password
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={busy}>{busy?"Submitting…":"Create account"}</button>
      </form>
    </div>
  );
}
