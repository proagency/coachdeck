import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id: true, role: true }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  return NextResponse.json({ banks });
}
export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const count = await prisma.coachBankAccount.count({ where: { coachId: me.id }});
  if (count >= 5) return NextResponse.json({ error: "max_channels" }, { status: 400 });
  const j = await req.json().catch(()=>null);
  if (!j?.bankName || !j?.accountName || !j?.accountNumber) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const bank = await prisma.coachBankAccount.create({ data: { coachId: me.id, bankName: String(j.bankName), bankBranch: j.bankBranch ? String(j.bankBranch) : null, accountName: String(j.accountName), accountNumber: String(j.accountNumber) } });
  return NextResponse.json({ bank }, { status: 201 });
}
export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachBankAccount.findFirst({ where: { id: j.id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data: any = {};
  if (j.bankName != null) data.bankName = String(j.bankName);
  if (j.bankBranch != null) data.bankBranch = j.bankBranch ? String(j.bankBranch) : null;
  if (j.accountName != null) data.accountName = String(j.accountName);
  if (j.accountNumber != null) data.accountNumber = String(j.accountNumber);
  const bank = await prisma.coachBankAccount.update({ where: { id: j.id }, data });
  return NextResponse.json({ bank });
}
export async function DELETE(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachBankAccount.findFirst({ where: { id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.coachBankAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
