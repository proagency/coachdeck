import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InvoiceStatus } from "@prisma/client";

// Validate payload against your Prisma enum
const Body = z.object({
  status: z.nativeEnum(InvoiceStatus),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // <-- Next 15: params is a Promise
) {
  const { id } = await ctx.params;          // <-- must await before using
  const session = await getServerSession(authOptions);
  const me = session?.user as any;

  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only SUPER_ADMIN or the owning COACH can change invoice status
  const isSuperAdmin = me.role === "SUPER_ADMIN";
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, coachId: true, studentId: true, status: true },
  });
  if (!invoice) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isCoachOwner = me.role === "COACH" && me.id === invoice.coachId;
  if (!isSuperAdmin && !isCoachOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, invoice: updated });
}
