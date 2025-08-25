// app/api/coach-payments/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["ONE_TIME", "SUBSCRIPTION"]),
  amount: z.number().int().nonnegative(),
  currency: z.string().default("PHP"),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const p = Body.parse(await req.json()); // ✅ no safeParse
  const plan = await prisma.paymentPlan.create({
    data: {
      name: p.name,
      description: p.description ?? null,
      type: p.type,
      amount: p.amount,
      currency: p.currency,
      active: p.active,
      coach: { connect: { id: me.id } },
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
