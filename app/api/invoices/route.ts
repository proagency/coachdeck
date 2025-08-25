// app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  planId: z.string().min(1),
  channel: z.enum(["BANK", "E_WALLET"]),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Optional: enforce student role
  // if (me.role !== "STUDENT") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const p = Body.parse(await req.json());

  const plan = await prisma.paymentPlan.findUnique({ where: { id: p.planId } });
  if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });

  const invoice = await prisma.invoice.create({
    data: {
      plan: { connect: { id: plan.id } },
      coach: { connect: { id: plan.coachId } },
      student: { connect: { id: me.id } },
      title: p.title ?? `Invoice — ${plan.name}`,
      description: p.description ?? null,
      amount: plan.amount,        // ← if your schema uses amountCents, change to: amountCents: plan.amountCents,
      currency: plan.currency,
      channel: p.channel,
      status: "PENDING",
    },
    include: { plan: true, coach: true },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
