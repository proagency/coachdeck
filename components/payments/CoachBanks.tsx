"use client";
import React from "react";

type Bank = { id:string; bankName:string; accountName:string; accountNumber:string; branch?:string };

export default function CoachBanks({ initial }: { initial: Bank[] }) {
  const [items, setItems] = React.useState<Bank[]>(initial || []);
  const [draft, setDraft] = React.useState({ bankName:"", accountName:"", accountNumber:"", branch:"" });

  async function add() {
    if (items.length >= 5) { (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Max 5 banks"}})); return; }
    const r = await fetch("/api/coach-payments/banks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    if (r.ok) {
      const j = await r.json(); setItems([j.bank, ...items]);
      setDraft({ bankName:"", accountName:"", accountNumber:"", branch:"" });
      (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Bank added"}}));
    } else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }
  async function remove(id:string) {
    const r = await fetch("/api/coach-payments/banks/"+id, { method:"DELETE" });
    if (r.ok) { setItems(items.filter(x=>x.id!==id)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Removed"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-2">
        <label className="label">Bank Name<input className="input" value={draft.bankName} onChange={e=>setDraft({...draft, bankName:e.target.value})} /></label>
        <label className="label">Account Name<input className="input" value={draft.accountName} onChange={e=>setDraft({...draft, accountName:e.target.value})} /></label>
        <label className="label">Account Number<input className="input" value={draft.accountNumber} onChange={e=>setDraft({...draft, accountNumber:e.target.value})} /></label>
        <label className="label">Branch (optional)<input className="input" value={draft.branch} onChange={e=>setDraft({...draft, branch:e.target.value})} /></label>
      </div>
      <button onClick={add} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Add Bank</button>

      <ul className="text-sm divide-y">
        {items.map(b=>(
          <li key={b.id} className="py-2 flex items-center justify-between">
            <div><div className="font-medium">{b.bankName}</div><div className="muted">{b.accountName} — {b.accountNumber}{b.branch?(" — "+b.branch):""}</div></div>
            <button onClick={()=>remove(b.id)} className="btn">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
