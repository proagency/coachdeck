import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CoachPaymentsConfigForm from "@/components/coach/CoachPaymentsConfigForm";
import CoachPlansForm from "@/components/coach/CoachPlansForm";
import CoachInvoicesTable from "@/components/coach/CoachInvoicesTable";
import CoachBankList from "@/components/coach/CoachBankList";
import CoachEwalletList from "@/components/coach/CoachEwalletList";
import CoachPaymentsSidebar, { CoachPaymentsMobileBurger } from "@/components/coach/CoachPaymentsSidebar";

export const metadata = { title: "Payments — Coach" };
export const dynamic = "force-dynamic";

export default async function CoachPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id:true, role:true }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return notFound();

  const cfg = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: {}, create: { coachId: me.id } });
  const plans = await prisma.paymentPlan.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const invoices = await prisma.invoice.findMany({ where: { coachId: me.id }, include: { student:true, plan:true, deck:true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <CoachPaymentsMobileBurger />
      <CoachPaymentsSidebar />
      <section className="space-y-8 md:ml-[288px]">
        <section id="toggles" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Payment Toggles</div>
          <CoachPaymentsConfigForm cfg={cfg} />
        </section>
        <section id="banks" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Bank Accounts</div>
          <CoachBankList />
        </section>
        <section id="ewallets" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">E-Wallets</div>
          <CoachEwalletList />
        </section>
        <section id="plans" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Plans</div>
          <CoachPlansForm initial={plans} />
        </section>
        <section id="invoices" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Invoices</div>
          <CoachInvoicesTable invoices={invoices} />
        </section>
      </section>
    </div>
  );
}
