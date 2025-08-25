import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["ONE_TIME","SUBSCRIPTION"]),
  amount: z.number().int().nonnegative(),
  currency: z.string().default("PHP"),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success || !me) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const plan = await prisma.paymentPlan.create({ data: { coachId: me.id, ...parsed.data } });
  return NextResponse.json({ plan }, { status: 201 });
}
