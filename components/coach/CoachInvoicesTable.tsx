"use client";
export default function CoachInvoicesTable({ invoices }: any) {
  async function setStatus(id: string, status: string){
    const r = await fetch(`/api/invoices/${id}/status`, { method:"PATCH", headers:{ "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Updated":"Failed"}}));
    if (r.ok) location.reload();
  }
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {invoices.map((i:any)=>(
          <li key={i.id} className="border rounded p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{i.plan?.name} — ₱{(i.amountCents/100).toFixed(2)} <span className="muted">({i.channel})</span></div>
              <div className="muted text-xs">Student: {i.student.email} · Status: {i.status}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>setStatus(i.id,"UNDER_REVIEW")}>Under review</button>
              <button className="btn" onClick={()=>setStatus(i.id,"PAID")}>Mark paid</button>
              <button className="btn" onClick={()=>setStatus(i.id,"REJECTED")}>Reject</button>
            </div>
          </li>
        ))}
        {invoices.length===0 && <li className="muted">No invoices yet.</li>}
      </ul>
    </div>
  );
}
