"use client";
import { useState } from "react";
type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export function TicketActions({ ticketId, current }: { ticketId: string; current: Status }) {
  const [status, setStatus] = useState<Status>(current);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStatus(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    setSaving(false);
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Updated":"Failed"}}));
    if (r.ok) location.reload();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }),
    });
    setSaving(false);
    if (r.ok) { setComment(""); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Reply sent"}})); location.reload(); }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Reply failed"}}));
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <form onSubmit={updateStatus} className="flex items-center gap-2">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option>
        </select>
        <button className="btn">Update</button>
      </form>
      <form onSubmit={addComment} className="flex items-center gap-2">
        <input className="input" placeholder="Write a reply…" value={comment} onChange={(e)=>setComment(e.target.value)} />
        <button className="btn">Reply</button>
      </form>
    </div>
  );
}
