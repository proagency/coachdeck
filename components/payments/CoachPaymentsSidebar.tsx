"use client";
import React from "react";

export default function CoachPaymentsSidebar() {
  const [open, setOpen] = React.useState(false);
  const items = [
    { href: "#toggles", label: "Payment Toggles" },
    { href: "#banks", label: "Bank Accounts" },
    { href: "#ewallets", label: "E-Wallets" },
    { href: "#plans", label: "Plans" },
    { href: "#invoices", label: "Invoices" },
  ];
  function scrollTo(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const id = (e.currentTarget.getAttribute("href") || "").replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }
  return (
    <>
      {/* Desktop: fixed floating */}
      <nav className="hidden lg:block fixed left-4 top-28 w-48 rounded-[3px] border bg-white shadow p-2">
        <div className="text-sm font-medium mb-2">Payments</div>
        <ul className="grid gap-1">
          {items.map(it => (
            <li key={it.href}><a href={it.href} onClick={scrollTo} className="block px-2 py-2 rounded-[3px] hover:bg-gray-100">{it.label}</a></li>
          ))}
        </ul>
      </nav>

      {/* Mobile: burger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed left-4 bottom-4 z-40 rounded-[3px] border bg-white shadow px-3 py-2">
        ☰ Payments
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30" onClick={()=>setOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow p-3" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Payments</div>
              <button onClick={()=>setOpen(false)} className="rounded-[3px] border px-2 py-1">✕</button>
            </div>
            <ul className="grid gap-1">
              {items.map(it => (
                <li key={it.href}><a href={it.href} onClick={scrollTo} className="block px-2 py-2 rounded-[3px] hover:bg-gray-100">{it.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
