import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const deckId = String(form.get("deckId") || "");
  const weekStart = new Date(String(form.get("weekStart") || ""));
  const summary = String(form.get("summary") || "");
  const blockers = String(form.get("blockers") || "") || null;
  const nextActions = String(form.get("nextActions") || "") || null;

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck) return NextResponse.json({ error: "deck_not_found" }, { status: 404 });
  if (!isAdmin && deck.coachId !== me.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.progressEntry.create({ data: { deckId, authorId: me.id, weekStart, summary, blockers, nextActions } });
  return NextResponse.redirect(new URL("/decks/"+deckId, req.url));
}
