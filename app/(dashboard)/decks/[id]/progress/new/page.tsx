import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Add Progress — CoachDeck" };

export default async function NewProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return notFound();

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return notFound();

  const deck = await prisma.deck.findFirst({ where: { id, coachId: me.id } });
  if (!deck && (session.user as any).accessLevel !== "ADMIN") return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Add Progress</h1>
      <form className="card grid gap-3" method="post" action="/api/progress">
        <input type="hidden" name="deckId" value={id} />
        <label className="label">Week start (YYYY-MM-DD)
          <input className="input" name="weekStart" type="date" required />
        </label>
        <label className="label">Summary
          <textarea className="input" name="summary" required />
        </label>
        <label className="label">Blockers
          <textarea className="input" name="blockers" />
        </label>
        <label className="label">Next actions
          <textarea className="input" name="nextActions" />
        </label>
        <button className="btn-primary">Save</button>
      </form>
    </div>
  );
}
