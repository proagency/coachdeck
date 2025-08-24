import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProofUploadForm from "@/components/student/ProofUploadForm";

export const metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true }});
  if (!me || me.role !== "STUDENT") return notFound();

  const inv = await prisma.invoice.findFirst({ where: { id, studentId: me.id }, include: { plan: { include: { coach: true } }, deck: true, coach: true } });
  if (!inv) return notFound();

  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: inv.coachId }});
  const ewallets = await prisma.coachEwallet.findMany({ where: { coachId: inv.coachId }});
  const cfg = await prisma.coachPaymentsConfig.findUnique({ where: { coachId: inv.coachId } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoice</h1>
      <div className="card space-y-2">
        <div className="font-medium">{inv.plan.name} <span className="muted">({inv.plan.type})</span></div>
        <div>Amount due: <b>₱{(inv.amountCents/100).toFixed(2)}</b> — Channel: {inv.channel}</div>
        <div className="muted text-sm">Coach: {inv.coach.email} · Deck: {inv.deck?.name || "-"}</div>
        <div className="muted text-sm">Status: {inv.status}</div>
      </div>

      <div className="card space-y-2">
        <div className="font-medium">Payment Instructions</div>
        {inv.channel === "BANK" && cfg?.enableBank && banks.length>0 ? (
          <ul className="list-disc ml-4 text-sm">{banks.map(b=>(<li key={b.id}>{b.bankName}{b.bankBranch ? " — "+b.bankBranch : ""} · {b.accountName} · {b.accountNumber}</li>))}</ul>
        ) : inv.channel === "E_WALLET" && cfg?.enableEwallet && ewallets.length>0 ? (
          <ul className="list-disc ml-4 text-sm">{ewallets.map(w=>(<li key={w.id}>{w.provider} · {w.accountName} · {w.accountNumber}{w.notes ? " — "+w.notes : ""}</li>))}</ul>
        ) : <div className="muted text-sm">Channel instructions not available.</div>}
      </div>

      <div className="card space-y-3">
        <div className="font-medium">Upload proof of payment (max 10MB)</div>
        {inv.proofUrl ? (<div className="text-sm">Uploaded: <a className="underline" href={inv.proofUrl} target="_blank">View file</a></div>) : (<ProofUploadForm id={inv.id} />)}
      </div>
    </div>
  );
}
