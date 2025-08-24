// app/api/tickets/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs"; // for nodemailer if configured

const Body = z.object({ body: z.string().min(1) });

export async function POST(req: NextRequest, ctx: any) {
  // Next 15: params must be awaited and the 2nd arg should not be strictly typed
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Correct include shape (deck -> include coach & membership->student)
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      deck: { include: { coach: true, membership: { include: { student: true } } } },
      author: true,
    },
  });
  if (!ticket) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const isCoach = ticket.deck.coachId === me.id;
  const isStudent = ticket.deck.membership?.studentId === me.id;
  const isAuthor = ticket.authorId === me.id;
  const isAssignee = ticket.assignedToId === me.id;

  if (!(isAdmin || isCoach || isStudent || isAuthor || isAssignee)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const comment = await prisma.ticketComment.create({
    data: { ticketId: ticket.id, authorId: me.id, body: parsed.data.body },
  });

  // Fire-and-forget email notify (won't block the response)
  (async () => {
    try {
      const toNotify =
        // if commenter is student, notify coach; otherwise notify student
        isStudent ? ticket.deck.coach.email : ticket.deck.membership?.student?.email;
      if (toNotify && process.env.EMAIL_SERVER) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as any);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: toNotify,
          subject: `New reply on ticket: ${ticket.title}`,
          text: `${email} replied:\n\n${parsed.data.body}`,
        });
      }
    } catch {
      // ignore email failures
    }
  })();

  return NextResponse.json({ comment }, { status: 201 });
}
