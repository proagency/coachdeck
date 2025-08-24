import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { Role, UserStatus } from "@prisma/client";

export async function POST(req: Request){
  const { email, name, password } = await req.json().catch(()=>({}));
  if (!email || !password || !name) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "email_taken" }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash: hash, role: Role.COACH, status: UserStatus.PENDING } });
  return NextResponse.json({ ok: true });
}
