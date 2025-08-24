import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const content = req.headers.get("content-type") || "";
  const raw: any = content.includes("application/x-www-form-urlencoded")
    ? Object.fromEntries((await req.formData()).entries())
    : await req.json();

  const deck = await prisma.deck.findFirst({ where: { id: String(raw.deckId||""), membership: { studentId: me.id } }, include: { coach: true }});
  if (!deck) return NextResponse.json({ error: "not_in_deck" }, { status: 403 });

  const ticket = await prisma.ticket.create({ data: { deckId: deck.id, authorId: me.id, title: String(raw.title||""), body: String(raw.body||"") } });

  // email coach
  await sendMail({ to: deck.coach.email!, subject: "New ticket", text: `A new ticket was created: ${ticket.title}` });
  return NextResponse.json({ ticket }, { status: 201 });
}
