import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await req.json().catch(()=>null);
  if (!data?.body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const t = await prisma.ticket.findUnique({ where: { id: params.id }, include: { deck: { include: { membership: { include: { student: true } }, coach: true } } } });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const can = t.authorId===me.id || t.assignedToId===me.id || t.deck.coachId===me.id;
  if (!can) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const comment = await prisma.ticketComment.create({ data: { ticketId: t.id, authorId: me.id, body: data.body } });

  // notify the other party
  const to = me.id === t.deck.coachId ? t.deck.membership?.student?.email : t.deck.coach.email;
  if (to) await sendMail({ to, subject: "New ticket reply", text: `New reply on: ${t.title} — ${data.body}` });

  return NextResponse.json({ comment }, { status: 201 });
}
