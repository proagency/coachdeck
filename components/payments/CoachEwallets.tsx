"use client";
import React from "react";
type Wallet = { id:string; provider:string; handle:string };

export default function CoachEwallets({ initial }: { initial: Wallet[] }) {
  const [items, setItems] = React.useState<Wallet[]>(initial || []);
  const [draft, setDraft] = React.useState({ provider:"", handle:"" });

  async function add() {
    if (items.length >= 5) { (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Max 5 wallets"}})); return; }
    const r = await fetch("/api/coach-payments/ewallets", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    if (r.ok) { const j = await r.json(); setItems([j.wallet, ...items]); setDraft({ provider:"", handle:"" }); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"E-Wallet added"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }
  async function remove(id:string) {
    const r = await fetch("/api/coach-payments/ewallets/"+id, { method:"DELETE" });
    if (r.ok) { setItems(items.filter(x=>x.id!==id)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Removed"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-2">
        <label className="label">Provider<input className="input" value={draft.provider} onChange={e=>setDraft({...draft, provider:e.target.value})} /></label>
        <label className="label">Handle<input className="input" value={draft.handle} onChange={e=>setDraft({...draft, handle:e.target.value})} placeholder="Phone / username" /></label>
      </div>
      <button onClick={add} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Add E-Wallet</button>

      <ul className="text-sm divide-y">
        {items.map(w=>(
          <li key={w.id} className="py-2 flex items-center justify-between">
            <div><div className="font-medium">{w.provider}</div><div className="muted">{w.handle}</div></div>
            <button onClick={()=>remove(w.id)} className="btn">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
