import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || me.role!=="STUDENT") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const inv = await prisma.invoice.findFirst({ where: { id: params.id, studentId: me.id } });
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (file.size > 10*1024*1024) return NextResponse.json({ error: "too_large" }, { status: 400 });

  // In production: upload to S3/R2/etc. For now, store as data URL (demo).
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = "data:"+file.type+";base64,"+buf.toString("base64");
  const updated = await prisma.invoice.update({ where: { id: inv.id }, data: { proofUrl: dataUrl, proofUploadedAt: new Date(), status: "AWAITING_PROOF" } });

  return NextResponse.json({ invoice: updated });
}
