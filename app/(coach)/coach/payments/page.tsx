import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachPaymentsSidebar from "@/components/payments/CoachPaymentsSidebar";
import CoachPaymentsConfigForm from "@/components/payments/CoachPaymentsConfigForm";
import CoachBanks from "@/components/payments/CoachBanks";
import CoachEwallets from "@/components/payments/CoachEwallets";
import CoachPlansForm from "@/components/payments/CoachPlansForm";
import CoachInvoicesTable from "@/components/payments/CoachInvoicesTable";

export const metadata = { title: "Payments — Coach" };

export default async function CoachPaymentsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return null;

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return null;

  const cfg = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: {}, create: { coachId: me.id } });
  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const wallets = await prisma.coachEwallet.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const plans = await prisma.paymentPlan.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const invoices = await prisma.invoice.findMany({ where: { coachId: me.id }, include: { student: true, plan: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="relative">
      <CoachPaymentsSidebar />
      <div className="lg:ml-56 space-y-6">
        <h1 className="text-2xl font-semibold">Payments</h1>

        <section id="toggles" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Payment Toggles</div>
          <CoachPaymentsConfigForm cfg={cfg} />
        </section>

        <section id="banks" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Bank Accounts</div>
          <CoachBanks initial={banks} />
        </section>

        <section id="ewallets" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">E-Wallets</div>
          <CoachEwallets initial={wallets} />
        </section>

        <section id="plans" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Plans</div>
          <CoachPlansForm initial={plans} />
        </section>

        <section id="invoices" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Invoices</div>
          <CoachInvoicesTable invoices={invoices} />
        </section>
      </div>
    </div>
  );
}
