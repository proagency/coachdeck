// app/api/coach/payments/plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateBody = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["ONE_TIME", "SUBSCRIPTION"]).optional(),
  amount: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params; // Next 15: await params
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const existing = await prisma.paymentPlan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  if (!isAdmin && existing.coachId !== me.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const p = UpdateBody.parse(await req.json());

  const plan = await prisma.paymentPlan.update({
    where: { id },
    data: {
      ...(typeof p.name !== "undefined" && { name: p.name }),
      ...(typeof p.description !== "undefined" && { description: p.description }),
      ...(typeof p.type !== "undefined" && { type: p.type }),
      ...(typeof p.amount !== "undefined" && { amount: p.amount }),
      ...(typeof p.currency !== "undefined" && { currency: p.currency }),
      ...(typeof p.active !== "undefined" && { active: p.active }),
    },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { id } = await ctx.params; // Next 15: await params
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const existing = await prisma.paymentPlan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  if (!isAdmin && existing.coachId !== me.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.paymentPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
