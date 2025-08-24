import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(()=>null);
  if (!body?.status) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const t = await prisma.ticket.findUnique({ where: { id: params.id }, include: { deck: { include: { membership: { include: { student: true } }, coach: true } } } });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const isCoach = t.deck.coachId === me.id;
  const isAuthor = t.authorId === me.id;
  const isAssignee = t.assignedToId === me.id;
  if (!isAdmin && !isCoach && !isAuthor && !isAssignee) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.ticket.update({ where: { id: t.id }, data: { status: body.status } });

  // email student
  if (t.deck.membership?.student?.email) {
    await sendMail({ to: t.deck.membership.student.email, subject: "Ticket status changed", text: `Ticket "${t.title}" is now ${updated.status}` });
  }
  return NextResponse.json({ ticket: updated });
}
