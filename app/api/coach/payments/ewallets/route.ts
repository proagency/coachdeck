import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id: true, role: true }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const items = await prisma.coachEwallet.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  return NextResponse.json({ ewallets: items });
}
export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const count = await prisma.coachEwallet.count({ where: { coachId: me.id }});
  if (count >= 5) return NextResponse.json({ error: "max_channels" }, { status: 400 });
  const j = await req.json().catch(()=>null);
  if (!j?.provider || !j?.accountName || !j?.accountNumber) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const item = await prisma.coachEwallet.create({ data: { coachId: me.id, provider: String(j.provider), accountName: String(j.accountName), accountNumber: String(j.accountNumber), notes: j.notes ? String(j.notes) : null } });
  return NextResponse.json({ ewallet: item }, { status: 201 });
}
export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachEwallet.findFirst({ where: { id: j.id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data: any = {};
  if (j.provider != null) data.provider = String(j.provider);
  if (j.accountName != null) data.accountName = String(j.accountName);
  if (j.accountNumber != null) data.accountNumber = String(j.accountNumber);
  if (j.notes != null) data.notes = j.notes ? String(j.notes) : null;
  const item = await prisma.coachEwallet.update({ where: { id: j.id }, data });
  return NextResponse.json({ ewallet: item });
}
export async function DELETE(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachEwallet.findFirst({ where: { id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.coachEwallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
