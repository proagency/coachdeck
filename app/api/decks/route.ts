import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request){
  const session = await getServerSession(authOptions);
  const meEmail = session?.user?.email || null;
  if (!meEmail) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: meEmail } });
  if (!me || me.role!=="COACH") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const name = String(form.get("name") || "");
  const studentEmail = String(form.get("studentEmail") || "");
  if (!name || !studentEmail) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  // create student if doesn't exist with temp password
  let student = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!student) {
    const tempPass = Math.random().toString(36).slice(2,10)+"A1!";
    const hash = await bcrypt.hash(tempPass, 10);
    student = await prisma.user.create({ data: { email: studentEmail, passwordHash: hash, role:"STUDENT", status: "ACTIVE" } });
    await sendMail({ to: studentEmail, subject: "Your CoachDeck account", text: `Temp password: ${tempPass}
Sign in at ${process.env.NEXTAUTH_URL||"http://localhost:3000"}/signin?email=${encodeURIComponent(studentEmail)}` });
  }

  const deck = await prisma.deck.create({ data: { name, coachId: me.id } });
  await prisma.membership.create({ data: { deckId: deck.id, studentId: student.id } });

  return NextResponse.redirect(new URL("/decks/"+deck.id, req.url));
}
