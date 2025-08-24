"use client";
import { useEffect, useState } from "react";

export default function CoachEwalletList() {
  const [items, setItems] = useState<any[]>([]);
  const [draft, setDraft] = useState({ provider:"", accountName:"", accountNumber:"", notes:"" });
  async function load(){ const r = await fetch("/api/coach/payments/ewallets"); const j = await r.json(); setItems(j.ewallets || []); }
  useEffect(()=>{ load(); }, []);
  async function add(e: React.FormEvent){
    e.preventDefault();
    const r = await fetch("/api/coach/payments/ewallets", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Added":"Failed"}}));
    if (r.ok){ setDraft({ provider:"", accountName:"", accountNumber:"", notes:"" }); load(); }
  }
  async function save(x:any){
    const r = await fetch("/api/coach/payments/ewallets", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(x) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Saved":"Save failed"}}));
  }
  async function del(id:string){
    const r = await fetch("/api/coach/payments/ewallets?id="+id, { method:"DELETE" });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Deleted":"Delete failed"}}));
    if (r.ok) load();
  }
  const maxed = items.length >= 5;
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((x)=>(
          <li key={x.id} className="border rounded p-3 grid md:grid-cols-5 gap-2 items-end">
            <label className="label">Provider
              <input className="input" value={x.provider} onChange={e=>{ x.provider=e.target.value; setItems([...items]); }} />
            </label>
            <label className="label">Account Name
              <input className="input" value={x.accountName} onChange={e=>{ x.accountName=e.target.value; setItems([...items]); }} />
            </label>
            <label className="label">Account Number
              <input className="input" value={x.accountNumber} onChange={e=>{ x.accountNumber=e.target.value; setItems([...items]); }} />
            </label>
            <label className="label md:col-span-1">Notes
              <input className="input" value={x.notes||""} onChange={e=>{ x.notes=e.target.value; setItems([...items]); }} />
            </label>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>save(x)} type="button">Save</button>
              <button className="btn" onClick={()=>del(x.id)} type="button">Delete</button>
            </div>
          </li>
        ))}
        {items.length===0 && <li className="muted">No e-wallets yet.</li>}
      </ul>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 items-end">
        <label className="label">Provider
          <input className="input" value={draft.provider} onChange={e=>setDraft(s=>({...s, provider:e.target.value}))} required />
        </label>
        <label className="label">Account Name
          <input className="input" value={draft.accountName} onChange={e=>setDraft(s=>({...s, accountName:e.target.value}))} required />
        </label>
        <label className="label">Account Number
          <input className="input" value={draft.accountNumber} onChange={e=>setDraft(s=>({...s, accountNumber:e.target.value}))} required />
        </label>
        <label className="label md:col-span-1">Notes
          <input className="input" value={draft.notes} onChange={e=>setDraft(s=>({...s, notes:e.target.value}))} />
        </label>
        <button className="btn-primary" disabled={maxed}>{maxed ? "Limit reached" : "Add"}</button>
      </form>
    </div>
  );
}
