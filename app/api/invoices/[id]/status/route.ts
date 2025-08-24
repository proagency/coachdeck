import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const j = await req.json().catch(()=>null);
  const allowed = new Set(["PENDING","AWAITING_PROOF","UNDER_REVIEW","PAID","REJECTED"]);
  if (!j?.status || !allowed.has(String(j.status))) return NextResponse.json({ error: "bad_status" }, { status: 400 });

  const inv = await prisma.invoice.findFirst({ where: { id: params.id, coachId: me.id } });
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.invoice.update({ where: { id: inv.id }, data: { status: j.status } });
  return NextResponse.json({ invoice: updated });
}
