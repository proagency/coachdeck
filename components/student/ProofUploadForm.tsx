"use client";
import { useState } from "react";

export default function ProofUploadForm({ id }: { id: string }) {
  const [file, setFile] = useState<File|null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Max 10MB"}})); return; }
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(`/api/invoices/${id}/upload`, { method: "POST", body: fd });
    setBusy(false);
    if (r.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Proof uploaded"}})); location.reload(); }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Upload failed"}}));
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input className="input" type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button className="btn-primary" disabled={busy || !file}>{busy ? "Uploading..." : "Upload"}</button>
    </form>
  );
}
