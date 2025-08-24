"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function UserMenu({ session }: { session: any }) {
  const [open, setOpen] = useState(false);
  const links: {href:string;label:string;role?:string}[] = [
    { href: "/profile", label: "Profile" },
    { href: "/signin", label: "Sign in" },
    { href: "/signup", label: "Sign up" },
    { href: "/decks", label: "Decks" },
    { href: "/tickets", label: "Tickets" },
    { href: "/coach/payments", label: "Payments (Coach)", role: "COACH" },
    { href: "/admin/approvals", label: "Approvals", role: "SUPER_ADMIN" },
  ];
  const role = session?.user?.role;

  return (
    <div className="relative">
      <button className="btn" onClick={()=>setOpen(true)} aria-label="User menu">
        {/* user icon */}
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor"/></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}>
          <div className="absolute right-4 top-16 w-64 bg-white border rounded shadow p-3" onClick={(e)=>e.stopPropagation()}>
            <div className="font-medium mb-2">{session?.user?.email || "Guest"}</div>
            <nav className="space-y-1">
              {links
                .filter(l => !l.role || l.role === role)
                .filter(l => {
                  if (session?.user) {
                    // hide sign-in/up when logged in
                    return !["/signin","/signup"].includes(l.href);
                  } else {
                    // hide sign-out targets
                    return !["/decks","/tickets","/coach/payments","/admin/approvals"].includes(l.href);
                  }
                })
                .map(l => <a key={l.href} className="btn w-full justify-start" href={l.href}>{l.label}</a>)
              }
              {session?.user ? (
                <button className="btn w-full justify-start" onClick={()=>signOut({ callbackUrl: "/" })}>Sign out</button>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
