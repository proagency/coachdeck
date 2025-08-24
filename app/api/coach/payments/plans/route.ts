import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id:true, role:true }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const plans = await prisma.paymentPlan.findMany({ where: { coachId: me.id }, orderBy: { createdAt:"desc" }});
  return NextResponse.json({ plans });
}
export async function POST(req: Request){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.name || !j?.amount || isNaN(Number(j.amount))) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const plan = await prisma.paymentPlan.create({ data: { coachId: me.id, name: String(j.name), description: j.description?String(j.description):null, type: j.type==="SUBSCRIPTION"?"SUBSCRIPTION":"ONE_TIME", amountCents: Math.round(Number(j.amount)*100) } });
  return NextResponse.json({ plan }, { status: 201 });
}
export async function PATCH(req: Request){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.paymentPlan.findFirst({ where: { id: j.id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data:any = {};
  if (j.name!=null) data.name = String(j.name);
  if (j.description!=null) data.description = j.description?String(j.description):null;
  if (j.type!=null) data.type = j.type==="SUBSCRIPTION"?"SUBSCRIPTION":"ONE_TIME";
  if (j.amount!=null) data.amountCents = Math.round(Number(j.amount)*100);
  if (j.active!=null) data.active = !!j.active;
  const plan = await prisma.paymentPlan.update({ where: { id: j.id }, data });
  return NextResponse.json({ plan });
}
export async function DELETE(req: Request){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.paymentPlan.findFirst({ where: { id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.paymentPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
