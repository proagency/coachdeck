import "./../styles/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToastHub from "@/components/ui/ToastHub";

export const metadata = { title: "CoachDeck", description: "Minimal 1:1 coaching workspace" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  function NavFor(user: any) {
    const items: { href: string; label: string }[] = [];
    if (user) {
      items.push({ href: "/profile", label: "Profile" });
      items.push({ href: "/decks", label: "Decks" });
      items.push({ href: "/tickets", label: "Tickets" });
      if (user.accessLevel === "ADMIN") items.push({ href: "/approvals", label: "Approvals" });
      items.push({ href: "/plans", label: "Plans & Billing" });
      items.push({ href: "/api/auth/signout?callbackUrl=/", label: "Sign out" });
    } else {
      items.push({ href: "/signin", label: "Sign in" });
      items.push({ href: "/signup", label: "Sign up" });
    }
    return items;
  }

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="container max-w-6xl p-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">CoachDeck</Link>
            <details className="relative">
              <summary className="list-none cursor-pointer p-2 rounded-[3px] border hover:bg-gray-50" aria-label="User menu">
                {/* user icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-[3px] border bg-white shadow p-2 grid">
                {NavFor(user).map((it) => (
                  <Link key={it.href} href={it.href} className="px-2 py-2 rounded-[3px] hover:bg-gray-100">{it.label}</Link>
                ))}
              </div>
            </details>
          </div>
        </header>
        <main className="container max-w-6xl p-6">{children}</main>
        <ToastHub />
      </body>
    </html>
  );
}
