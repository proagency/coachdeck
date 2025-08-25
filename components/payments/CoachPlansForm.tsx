"use client";
import React from "react";

type Plan = { id:string; name:string; description?:string|null; type:"ONE_TIME"|"SUBSCRIPTION"; amount:number; currency:string; active:boolean };

export default function CoachPlansForm({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = React.useState<Plan[]>(initial || []);
  const [draft, setDraft] = React.useState<Plan>({ id:"", name:"", description:"", type:"ONE_TIME", amount:0, currency:"PHP", active:true });

  async function create() {
    const r = await fetch("/api/coach-payments/plans", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    if (r.ok) { const j = await r.json(); setPlans([j.plan, ...plans]); setDraft({ id:"", name:"", description:"", type:"ONE_TIME", amount:0, currency:"PHP", active:true}); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Plan created"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  async function update(p: Plan) {
    const r = await fetch("/api/coach-payments/plans/"+p.id, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(p) });
    if (r.ok) { const j = await r.json(); setPlans((prev)=>prev.map(x=>x.id===p.id?j.plan:x)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Plan updated"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  async function remove(id: string) {
    const r = await fetch("/api/coach-payments/plans/"+id, { method:"DELETE" });
    if (r.ok) { setPlans(plans.filter(x=>x.id!==id)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Deleted"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <label className="label">Name<input className="input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
        <label className="label">Type
          <select className="input" value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as any})}>
            <option value="ONE_TIME">One-time</option>
            <option value="SUBSCRIPTION">Subscription</option>
          </select>
        </label>
        <label className="label">Amount (₱)
          <input className="input" type="number" min={0} value={draft.amount} onChange={e=>setDraft({...draft,amount:parseInt(e.target.value||"0")})}/>
        </label>
        <label className="label md:col-span-3">Description
          <textarea className="input" value={draft.description ?? ""} onChange={e=>setDraft({...draft,description:e.target.value})} />
        </label>
      </div>
      <button onClick={create} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Create Plan</button>

      <ul className="divide-y">
        {plans.map(p=>(
          <li key={p.id} className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.name} <span className="muted">({p.type === "ONE_TIME" ? "One-time" : "Subscription"})</span></div>
              <div className="flex items-center gap-2">
                <button onClick={()=>remove(p.id)} className="btn">Delete</button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <label className="label">Amount (₱)
                <input className="input" type="number" min={0} defaultValue={p.amount} onChange={e=>p.amount=parseInt(e.target.value||"0")} />
              </label>
              <label className="label">Currency
                <input className="input" defaultValue={p.currency} onChange={e=>p.currency=e.target.value} />
              </label>
              <label className="label">Active
                <select className="input" defaultValue={p.active ? "1":"0"} onChange={e=>p.active=e.target.value==="1"}>
                  <option value="1">Yes</option><option value="0">No</option>
                </select>
              </label>
              <label className="label md:col-span-3">Description
                <textarea className="input" defaultValue={p.description ?? ""} onChange={e=>p.description=e.target.value}/>
              </label>
            </div>
            <button onClick={()=>update(p)} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Save</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
