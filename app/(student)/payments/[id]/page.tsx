// app/(student)/payments/[id]/page.tsx
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = { title: "Invoice — CoachDeck" };

export default async function StudentInvoicePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next 15: await params
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return notFound();

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me || me.role !== "STUDENT") return notFound();

  const inv = await prisma.invoice.findFirst({
    where: { id, studentId: me.id },
    include: {
      plan: true,     // OK
      coach: true,    // OK
      // deck: true,   // ❌ not a relation on Invoice; removed
    },
  });
  if (!inv) return notFound();

  const [banks, wallets] = await Promise.all([
    prisma.coachBankAccount.findMany({ where: { coachId: inv.coachId } }),
    prisma.coachEwallet.findMany({ where: { coachId: inv.coachId } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoice</h1>

      <div className="card space-y-2">
        <div className="font-medium">{inv.title}</div>
        {inv.description && <div className="muted">{inv.description}</div>}
        <div className="text-sm">
          Plan: {inv.plan?.name ?? "—"} • Coach: {inv.coach.email}
        </div>
        <div className="text-lg">
          Amount: ₱{inv.amount.toLocaleString()} {inv.currency}
        </div>
        <div className="text-sm">Status: {inv.status}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-medium mb-2">Bank Transfer</div>
          <ul className="text-sm space-y-2">
            {banks.length ? (
              banks.map((b) => (
                <li key={b.id}>
                  <div className="font-medium">{b.bankName}</div>
                  <div className="muted">
                    {b.accountName} — {b.accountNumber}
                    {b.branch ? ` — ${b.branch}` : ""}
                  </div>
                </li>
              ))
            ) : (
              <li className="muted">No bank accounts provided.</li>
            )}
          </ul>
        </div>

        <div className="card">
          <div className="font-medium mb-2">E-Wallets</div>
          <ul className="text-sm space-y-2">
            {wallets.length ? (
              wallets.map((w) => (
                <li key={w.id}>
                  <div className="font-medium">{w.provider}</div>
                  <div className="muted">{w.handle}</div>
                </li>
              ))
            ) : (
              <li className="muted">No e-wallets provided.</li>
            )}
          </ul>
        </div>
      </div>

      <form
        className="card space-y-3"
        action={`/api/invoices/${inv.id}/upload`}
        method="post"
        encType="multipart/form-data"
      >
        <div className="font-medium">Upload Proof of Payment</div>
        <input
          className="input"
          type="file"
          name="file"
          accept="image/*,application/pdf"
          required
        />
        <button className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
          Upload
        </button>
        <div className="muted text-xs">Max 10MB. Images or PDF.</div>
      </form>
    </div>
  );
}
