import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json().catch(()=>({}));
  if (!email) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000*60*60);

  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
  }

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendMail({ to: email, subject: "Reset your CoachDeck password", text: `Click this link to reset your password (valid 1h): ${link}`, html: `<p>Click to reset (valid 1h): <a href="${link}">${link}</a></p>` });

  return NextResponse.json({ ok: true, sent: true });
}
