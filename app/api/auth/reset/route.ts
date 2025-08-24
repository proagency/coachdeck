import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(()=>({}));
  if (!token || typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!rec) return NextResponse.json({ error: "invalid_or_used_token" }, { status: 400 });
  if (rec.expiresAt.getTime() < Date.now()) { await prisma.passwordResetToken.delete({ where: { token } }).catch(()=>{}); return NextResponse.json({ error: "token_expired" }, { status: 400 }); }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: hash } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: rec.userId } });
  return NextResponse.json({ ok: true });
}
