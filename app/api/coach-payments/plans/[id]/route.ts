import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await req.json();
  const plan = await prisma.paymentPlan.update({ where: { id }, data });
  return NextResponse.json({ plan });
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  await prisma.paymentPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
