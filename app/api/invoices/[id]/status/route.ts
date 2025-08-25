import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({ status: z.enum(["PENDING","SUBMITTED","UNDER_REVIEW","PAID","REJECTED","CANCELED"]) });

export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (inv.coachId !== me.id && (session.user as any).accessLevel !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.invoice.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ invoice: updated });
}
