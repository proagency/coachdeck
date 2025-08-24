"use client";
import { useState } from "react";

export function DocCreateForm({ deckId }: { deckId: string }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/documents", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deckId, title, url }),
    });
    if (res.ok) { setTitle(""); setUrl(""); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Document added"}})); location.reload(); }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed to add"}}));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input className="input" placeholder="File name" value={title} onChange={(e)=>setTitle(e.target.value)} required />
      <input className="input" placeholder="https://…" value={url} onChange={(e)=>setUrl(e.target.value)} />
      <button className="btn">Add Document</button>
    </form>
  );
}
