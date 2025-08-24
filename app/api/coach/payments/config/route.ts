import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const cfg = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: {}, create: { coachId: me.id } });
  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const ewallets = await prisma.coachEwallet.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  return NextResponse.json({ config: cfg, banks, ewallets });
}
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  const data: any = { enableBank: !!j?.enableBank, enableEwallet: !!j?.enableEwallet };
  const updated = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: data, create: { coachId: me.id, ...data } });
  return NextResponse.json({ config: updated });
}
