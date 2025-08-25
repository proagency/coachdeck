"use client";
import React from "react";

export default function CoachPaymentsConfigForm({ cfg }: any) {
  const [state, setState] = React.useState({ enableBank: cfg.enableBank, enableEwallet: cfg.enableEwallet });
  async function save() {
    const r = await fetch("/api/coach-payments/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
    if (r.ok) (window as any).dispatchEvent(new CustomEvent("toast", { detail: { kind: "success", msg: "Saved" } }));
    else (window as any).dispatchEvent(new CustomEvent("toast", { detail: { kind: "error", msg: "Save failed" } }));
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.enableBank} onChange={(e)=>setState(s=>({ ...s, enableBank: e.target.checked }))}/> Enable Bank Transfer</label>
      <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.enableEwallet} onChange={(e)=>setState(s=>({ ...s, enableEwallet: e.target.checked }))}/> Enable E-Wallet</label>
      <button onClick={save} className="btn self-start border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Save</button>
    </div>
  );
}
