import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
const Body = z.object({ status: z.enum(["OPEN","IN_PROGRESS","RESOLVED","CLOSED"]) });

export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { deck: { include: { membership: { include: { student: true } }, coach: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const isCoach = ticket.deck.coachId === me.id;
  if (!(isAdmin || isCoach)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.ticket.update({ where: { id }, data: { status: parsed.data.status } });

  (async () => {
    try {
      const studentEmail = ticket.deck.membership?.student?.email;
      if (studentEmail && process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as any);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: studentEmail,
          subject: `Ticket status updated: ${ticket.title}`,
          text: `Status is now: ${parsed.data.status}`,
        });
      }
    } catch {}
  })();

  return NextResponse.json({ ticket: updated });
}
