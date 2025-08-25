// app/api/auth/forgot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond 200 to avoid email enumeration, but only create token if user exists
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    // Build reset URL
    const base = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const url = new URL("/reset-password", base);
    url.searchParams.set("token", token);
    url.searchParams.set("email", email);

    // Send email if SMTP configured; otherwise no-op (you can log url)
    try {
      if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as any);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Reset your CoachDeck password",
          text: `Click this link to reset your password:\n\n${url.toString()}\n\nThis link expires in 30 minutes.`,
        });
      } else {
        console.log("[DEV] Password reset link:", url.toString());
      }
    } catch (e) {
      // don’t leak errors to user
      console.warn("Reset email failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
