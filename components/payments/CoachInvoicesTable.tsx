"use client";
import React from "react";

type Invoice = { id:string; title:string; amount:number; currency:string; status:string; plan?:{ name:string|null }|null; student?:{ email:string|null }|null };

export default function CoachInvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const [items, setItems] = React.useState(invoices || []);
  async function setStatus(id:string, status:string){
    const r = await fetch(`/api/invoices/${id}/status`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ status }) });
    if (r.ok){ const j = await r.json(); setItems(prev=>prev.map(x=>x.id===id?{...x,status:j.invoice.status}:x)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Status updated"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Update failed"}}));
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th className="py-2">Title</th><th>Student</th><th>Plan</th><th>Amount</th><th>Status</th><th/></tr></thead>
        <tbody>
          {items.map(inv=>(
            <tr key={inv.id} className="border-t">
              <td className="py-2">{inv.title}</td>
              <td>{inv.student?.email ?? "—"}</td>
              <td>{inv.plan?.name ?? "—"}</td>
              <td>₱{(inv.amount/1).toLocaleString()}</td>
              <td>{inv.status}</td>
              <td>
                <select className="input" defaultValue={inv.status} onChange={e=>setStatus(inv.id, e.target.value)}>
                  <option>PENDING</option><option>SUBMITTED</option><option>UNDER_REVIEW</option><option>PAID</option><option>REJECTED</option><option>CANCELED</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
