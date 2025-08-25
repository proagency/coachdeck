// app/api/tickets/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs"; // needed for next-auth + optional SMTP

const Body = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export async function PATCH(req: NextRequest, ctx: any) {
  // Next 15 dynamic routes: params must be awaited & don't over-type the 2nd arg
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Load ticket with deck, coach, and student for permission + notifications
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      deck: {
        include: {
          coach: true,
          membership: { include: { student: true } },
        },
      },
    },
  });
  if (!ticket) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN"; // Super Admin
  const isCoach = ticket.deck.coachId === me.id;                  // Deck's coach

  // Server-side enforcement: only Super Admin or Coach can change status
  if (!(isAdmin || isCoach)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: parsed.data.status },
    select: {
      id: true,
      status: true,
      title: true,
      deck: {
        select: {
          membership: { select: { student: { select: { email: true } } } },
          coach: { select: { email: true } },
        },
      },
    },
  });

  // Fire-and-forget: notify the student when status changes
  (async () => {
    try {
      const studentEmail = updated.deck.membership?.student?.email;
      if (studentEmail && process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as any);

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: studentEmail,
          subject: `Ticket status updated: ${updated.title}`,
          text: `Hi,\n\nThe status of your ticket "${updated.title}" is now: ${updated.status}.\n\n— CoachDeck`,
        });
      }
    } catch {
      // ignore email failures
    }
  })();

  return NextResponse.json({ ticket: updated });
}
