"use client";
import { useState, FormEvent } from "react";

export default function CoachPaymentsConfigForm({ cfg }: any) {
  const [state, setState] = useState({ enableBank: !!cfg.enableBank, enableEwallet: !!cfg.enableEwallet });
  async function save(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/coach/payments/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
    window.dispatchEvent(new CustomEvent("toast", { detail: { kind: res.ok ? "success" : "error", msg: res.ok ? "Saved" : "Save failed" } }));
    if (res.ok) location.reload();
  }
  return (
    <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
      <label className="label">Enable Bank Transfer
        <div className="mt-1"><input type="checkbox" checked={state.enableBank} onChange={e=>setState(s=>({...s, enableBank:e.target.checked}))} /></div>
      </label>
      <label className="label">Enable e-Wallet
        <div className="mt-1"><input type="checkbox" checked={state.enableEwallet} onChange={e=>setState(s=>({...s, enableEwallet:e.target.checked}))} /></div>
      </label>
      <div className="md:col-span-2"><button className="btn-primary">Save</button></div>
    </form>
  );
}
