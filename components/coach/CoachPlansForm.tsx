"use client";
import { useEffect, useState, FormEvent } from "react";
type Plan = { id:string; name:string; description?:string|null; type:"ONE_TIME"|"SUBSCRIPTION"; amountCents:number; active:boolean };

export default function CoachPlansForm({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initial || []);
  const [draft, setDraft] = useState({ name:"", description:"", type:"ONE_TIME", amount:"" });

  async function refresh(){ const r = await fetch("/api/coach/payments/plans"); const j = await r.json(); setPlans(j.plans || []); }
  async function add(e: FormEvent){ e.preventDefault();
    const res = await fetch("/api/coach/payments/plans", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ...draft, amount: Number(draft.amount||0) }) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:res.ok?"success":"error",msg:res.ok?"Plan added":"Failed"}}));
    if (res.ok){ setDraft({ name:"", description:"", type:"ONE_TIME", amount:"" }); refresh(); }
  }
  async function del(id: string){ const res = await fetch("/api/coach/payments/plans?id="+id, { method:"DELETE" }); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:res.ok?"success":"error",msg:res.ok?"Deleted":"Delete failed"}})); if (res.ok) refresh(); }
  async function save(p: Plan){ const res = await fetch("/api/coach/payments/plans", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id: p.id, name: p.name, description: p.description||"", type: p.type, amount: (p.amountCents/100), active: p.active }) }); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:res.ok?"success":"error",msg:res.ok?"Saved":"Save failed"}})); if (res.ok) refresh(); }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="grid md:grid-cols-4 gap-3">
        <label className="label md:col-span-2">Plan name
          <input className="input" value={draft.name} onChange={e=>setDraft(s=>({...s, name:e.target.value}))} required />
        </label>
        <label className="label">Type
          <select className="input" value={draft.type} onChange={e=>setDraft(s=>({...s, type:e.target.value}))}><option value="ONE_TIME">One-time</option><option value="SUBSCRIPTION">Subscription</option></select>
        </label>
        <label className="label">Amount (₱)
          <input className="input" type="number" min="0" step="0.01" value={draft.amount} onChange={e=>setDraft(s=>({...s, amount:e.target.value}))} required />
        </label>
        <label className="label md:col-span-4">Description (optional)
          <input className="input" value={draft.description} onChange={e=>setDraft(s=>({...s, description:e.target.value}))} />
        </label>
        <div className="md:col-span-4"><button className="btn-primary">Add Plan</button></div>
      </form>

      <ul className="space-y-2">
        {plans.map((p)=>(
          <li key={p.id} className="border rounded p-3 space-y-2">
            <div className="grid md:grid-cols-5 gap-2 items-end">
              <label className="label md:col-span-2">Name
                <input className="input" value={p.name} onChange={e=>{ p.name=e.target.value; setPlans([...plans]); }} />
              </label>
              <label className="label">Type
                <select className="input" value={p.type} onChange={e=>{ p.type=e.target.value as any; setPlans([...plans]); }}>
                  <option value="ONE_TIME">One-time</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                </select>
              </label>
              <label className="label">Amount (₱)
                <input className="input" type="number" min="0" step="0.01"
                  value={(p.amountCents/100).toString()}
                  onChange={e=>{ const v = Number(e.target.value || 0); p.amountCents = Math.round(v*100); setPlans([...plans]); }} />
              </label>
              <label className="label md:col-span-5">Description
                <input className="input" value={p.description || ""} onChange={e=>{ p.description=e.target.value; setPlans([...plans]); }} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="label"><input type="checkbox" className="mr-2" checked={p.active} onChange={e=>{ p.active=e.target.checked; setPlans([...plans]); }} />Active</label>
              <div className="flex gap-2">
                <button className="btn" onClick={()=>save(p)} type="button">Save</button>
                <button className="btn" onClick={()=>del(p.id)} type="button">Delete</button>
              </div>
            </div>
          </li>
        ))}
        {plans.length===0 && <li className="muted">No plans yet.</li>}
      </ul>
    </div>
  );
}
