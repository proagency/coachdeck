"use client";
import { useEffect, useState } from "react";
const items = [
  { id: "toggles",  label: "Payment Toggles" },
  { id: "banks",    label: "Bank Accounts" },
  { id: "ewallets", label: "E-Wallets" },
  { id: "plans",    label: "Plans" },
  { id: "invoices", label: "Invoices" },
];
function NavList({ active, onGo }: { active: string; onGo: (id:string)=>void }) {
  const linkBase = "btn w-full justify-start";
  const activeCx = "border-blue-600 text-blue-700 ring-1 ring-blue-600";
  return (
    <nav className="space-y-2">
      {items.map((it) => (
        <button key={it.id} className={`${linkBase} ${active === it.id ? activeCx : ""}`} onClick={() => onGo(it.id)}>{it.label}</button>
      ))}
    </nav>
  );
}
export default function CoachPaymentsSidebar() {
  const [active, setActive] = useState("toggles");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }); },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    items.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  function go(id: string) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  return (<div className="hidden md:block fixed left-6 top-24 w-[240px] z-40"><div className="card"><NavList active={active} onGo={go} /></div></div>);
}
export function CoachPaymentsMobileBurger() {
  const [open, setOpen] = useState(false);
  function go(id: string){ const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); setOpen(false); }
  useEffect(()=>{ document.body.style.overflow = open ? "hidden" : ""; return ()=>{ document.body.style.overflow = ""; }; }, [open]);
  return (
    <div className="md:hidden">
      <button className="btn" onClick={()=>setOpen(true)} aria-label="Open menu"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>Menu</button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Payments Menu</div>
              <button className="btn" onClick={()=>setOpen(false)} aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg></button>
            </div>
            <nav className="space-y-2">{items.map((it)=>(<button key={it.id} className="btn w-full justify-start" onClick={()=>go(it.id)}>{it.label}</button>))}</nav>
          </div>
        </div>
      )}
    </div>
  );
}
