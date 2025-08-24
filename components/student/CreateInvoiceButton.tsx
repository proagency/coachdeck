"use client";
import { useState } from "react";

export default function CreateInvoiceButton({ planId, enableBank, enableEwallet }: { planId: string; enableBank: boolean; enableEwallet: boolean }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState(enableBank ? "BANK" : "E_WALLET");
  async function create() {
    const r = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, channel }) });
    if (r.ok) { const j = await r.json(); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Invoice created"}})); location.href = "/payments/" + j.invoice.id; }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>Select & Create Invoice</button>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-sm space-y-3">
            <div className="font-medium">Choose payment channel</div>
            <select className="input" value={channel} onChange={(e)=>setChannel(e.target.value)}>
              {enableBank && <option value="BANK">Bank transfer</option>}
              {enableEwallet && <option value="E_WALLET">e-Wallet</option>}
            </select>
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
