import "./../styles/globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import Toast from "@/components/Toast";

export const metadata = { title: "CoachDeck", description: "Minimal 1:1 coaching workspace" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-30">
          <div className="container max-w-6xl p-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">CoachDeck</Link>
            <UserMenu session={session} />
          </div>
        </header>
        <main className="container max-w-6xl p-6">{children}</main>
        <Toast />
      </body>
    </html>
  );
}
