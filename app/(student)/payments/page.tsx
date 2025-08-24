import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import CreateInvoiceButton from "@/components/student/CreateInvoiceButton";

export const metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true }});
  if (!me || me.role !== "STUDENT") return notFound();

  const mem = await prisma.membership.findFirst({ where: { studentId: me.id }, include: { deck: { include: { coach: true } } } });
  const coachId = mem?.deck?.coachId || null;

  let plans: any[] = [];
  let banks: any[] = [];
  let ewallets: any[] = [];
  let toggles: any = null;

  if (coachId) {
    toggles = await prisma.coachPaymentsConfig.findUnique({ where: { coachId } });
    plans = await prisma.paymentPlan.findMany({ where: { coachId, active: true }, orderBy: { createdAt: "desc" } });
    banks = await prisma.coachBankAccount.findMany({ where: { coachId }, orderBy: { createdAt: "desc" } });
    ewallets = await prisma.coachEwallet.findMany({ where: { coachId }, orderBy: { createdAt: "desc" } });
  }

  const invoices = await prisma.invoice.findMany({ where: { studentId: me.id }, include: { plan: true, coach: true, deck: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Payments</h1>

      <section className="card">
        <div className="font-medium mb-2">Available Plans</div>
        {coachId ? (
          <>
            {plans.length ? (
              <ul className="grid md:grid-cols-2 gap-3">
                {plans.map((p)=>(
                  <li key={p.id} className="border rounded p-3 space-y-2">
                    <div className="font-medium">{p.name} <span className="muted">({p.type})</span></div>
                    <div>₱{(p.amountCents/100).toFixed(2)}</div>
                    <CreateInvoiceButton planId={p.id} enableBank={!!toggles?.enableBank && banks.length>0} enableEwallet={!!toggles?.enableEwallet && ewallets.length>0} />
                  </li>
                ))}
              </ul>
            ) : <div className="muted">No plans published yet.</div>}
            <div className="text-sm muted mt-4 space-y-3">
              {toggles?.enableBank && banks.length>0 && (
                <div>
                  <div className="font-medium">Bank transfer</div>
                  <ul className="list-disc ml-4">
                    {banks.map(b=>(<li key={b.id}>{b.bankName}{b.bankBranch ? " — "+b.bankBranch : ""} · {b.accountName} · {b.accountNumber}</li>))}
                  </ul>
                </div>
              )}
              {toggles?.enableEwallet && ewallets.length>0 && (
                <div>
                  <div className="font-medium">e-Wallets</div>
                  <ul className="list-disc ml-4">
                    {ewallets.map(w=>(<li key={w.id}>{w.provider} · {w.accountName} · {w.accountNumber}{w.notes ? " — "+w.notes : ""}</li>))}
                  </ul>
                </div>
              )}
            </div>
          </>
        ) : <div className="muted">No coach found for your deck yet.</div>}
      </section>

      <section className="card">
        <div className="font-medium mb-2">My Invoices</div>
        <ul className="space-y-2">
          {invoices.map((i)=>(
            <li key={i.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{i.plan?.name} — ₱{(i.amountCents/100).toFixed(2)} <span className="muted">({i.channel})</span></div>
                <div className="muted text-xs">Status: {i.status} · {new Date(i.createdAt).toLocaleString()}</div>
              </div>
              <Link className="btn" href={"/payments/"+i.id}>Open</Link>
            </li>
          ))}
          {invoices.length===0 && <li className="muted">No invoices yet.</li>}
        </ul>
      </section>
    </div>
  );
}
