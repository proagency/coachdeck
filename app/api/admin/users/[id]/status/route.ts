import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const status = String(form.get("status") || "");
  if (!["ACTIVE","DISABLED"].includes(status)) return NextResponse.json({ error: "bad_status" }, { status: 400 });
  await prisma.user.update({ where: { id: params.id }, data: { status: status as UserStatus } });
  return NextResponse.json({ ok: true });
}
