import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id:true, role:true }});
  if (!me || me.role!=="STUDENT") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const j = await req.json().catch(()=>null);
  const plan = await prisma.paymentPlan.findUnique({ where: { id: String(j?.planId || "") }, include: { coach: true }});
  if (!plan || !plan.active) return NextResponse.json({ error: "plan_invalid" }, { status: 400 });

  // resolve deck (student's membership with this coach)
  const mem = await prisma.membership.findFirst({ where: { studentId: me.id, deck: { coachId: plan.coachId } }, include: { deck: true }});
  const invoice = await prisma.invoice.create({
    data: {
      planId: plan.id, coachId: plan.coachId, studentId: me.id, deckId: mem?.deckId || null,
      channel: j?.channel==="BANK" ? "BANK" : "E_WALLET",
      amountCents: plan.amountCents,
    }
  });
  return NextResponse.json({ invoice }, { status: 201 });
}
