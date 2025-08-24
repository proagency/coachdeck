"use client";
import { useEffect, useState } from "react";

export default function CoachBankList() {
  const [banks, setBanks] = useState<any[]>([]);
  const [draft, setDraft] = useState({ bankName:"", bankBranch:"", accountName:"", accountNumber:"" });
  async function load(){ const r = await fetch("/api/coach/payments/banks"); const j = await r.json(); setBanks(j.banks || []); }
  useEffect(()=>{ load(); }, []);
  async function add(e: React.FormEvent){
    e.preventDefault();
    const r = await fetch("/api/coach/payments/banks", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Added":"Failed"}}));
    if (r.ok){ setDraft({ bankName:"", bankBranch:"", accountName:"", accountNumber:"" }); load(); }
  }
  async function save(b:any){
    const r = await fetch("/api/coach/payments/banks", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(b) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Saved":"Save failed"}}));
  }
  async function del(id:string){
    const r = await fetch("/api/coach/payments/banks?id="+id, { method:"DELETE" });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Deleted":"Delete failed"}}));
    if (r.ok) load();
  }
  const maxed = banks.length >= 5;
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {banks.map((b)=>(
          <li key={b.id} className="border rounded p-3 grid md:grid-cols-5 gap-2 items-end">
            <label className="label">Bank
              <input className="input" value={b.bankName} onChange={e=>{ b.bankName=e.target.value; setBanks([...banks]); }} />
            </label>
            <label className="label">Branch
              <input className="input" value={b.bankBranch||""} onChange={e=>{ b.bankBranch=e.target.value; setBanks([...banks]); }} />
            </label>
            <label className="label">Account Name
              <input className="input" value={b.accountName} onChange={e=>{ b.accountName=e.target.value; setBanks([...banks]); }} />
            </label>
            <label className="label">Account No.
              <input className="input" value={b.accountNumber} onChange={e=>{ b.accountNumber=e.target.value; setBanks([...banks]); }} />
            </label>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>save(b)} type="button">Save</button>
              <button className="btn" onClick={()=>del(b.id)} type="button">Delete</button>
            </div>
          </li>
        ))}
        {banks.length===0 && <li className="muted">No bank accounts yet.</li>}
      </ul>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 items-end">
        <label className="label">Bank
          <input className="input" value={draft.bankName} onChange={e=>setDraft(s=>({...s, bankName:e.target.value}))} required />
        </label>
        <label className="label">Branch
          <input className="input" value={draft.bankBranch} onChange={e=>setDraft(s=>({...s, bankBranch:e.target.value}))} />
        </label>
        <label className="label">Account Name
          <input className="input" value={draft.accountName} onChange={e=>setDraft(s=>({...s, accountName:e.target.value}))} required />
        </label>
        <label className="label">Account No.
          <input className="input" value={draft.accountNumber} onChange={e=>setDraft(s=>({...s, accountNumber:e.target.value}))} required />
        </label>
        <button className="btn-primary" disabled={maxed}>{maxed ? "Limit reached" : "Add"}</button>
      </form>
    </div>
  );
}
