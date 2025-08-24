import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { TicketActions } from "@/components/TicketActions";
import { DocCreateForm } from "@/components/DocCreateForm";

export default async function DeckDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return notFound();

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return notFound();

  const deck = await prisma.deck.findFirst({
    where: { id, OR: [{ coachId: me.id }, { membership: { studentId: me.id } }] },
    include: {
      coach: true,
      membership: { include: { student: true } },
      documents: true,
      progress: { orderBy: { weekStart: "desc" }, take: 4 },
      tickets: {
        orderBy: { createdAt: "desc" },
        include: { comments: { orderBy: { createdAt: "asc" } }, author: true },
      },
    },
  });
  if (!deck) return notFound();

  const isCoach = deck.coachId === me.id;
  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const isStudent = deck.membership?.studentId === me.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{deck.name}</h1>
        <a className="btn" href="/decks">Back</a>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="font-medium">Coach</div>
          <div className="muted">{deck.coach.email}</div>
        </div>
        <div className="card">
          <div className="font-medium">Student</div>
          <div className="muted">{deck.membership?.student?.email ?? "No student yet"}</div>
        </div>
        <div className="card">
          <div className="font-medium">{isCoach || isAdmin ? "Create Ticket (student-only UI hidden)" : "Create Ticket"}</div>
          {isStudent ? (
            <form className="space-y-2" method="post" action="/api/tickets">
              <input type="hidden" name="deckId" value={deck.id} />
              <input className="input" name="title" placeholder="Title" required />
              <textarea className="input" name="body" placeholder="Describe the issue…" required />
              <button className="btn-primary">Create</button>
            </form>
          ) : (
            <div className="muted text-sm">Only the student sees the create form.</div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card">
          <div className="font-medium mb-2">Tickets</div>
          <ul className="space-y-3">
            {deck.tickets.map((t) => (
              <li key={t.id} className="border rounded p-3">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm muted">{t.body}</div>
                <div className="text-xs mt-1 muted">by {t.author.email} — {t.status}</div>
                <ul className="mt-2 text-sm space-y-1">
                  {t.comments.map((c) => (<li key={c.id} className="muted">↳ {c.body}</li>))}
                </ul>
                {(isCoach || isAdmin) && <TicketActions ticketId={t.id} current={t.status as any} />}
                {!isCoach && !isAdmin && <div className="muted text-xs mt-2">Status updates visible to coach / admin.</div>}
              </li>
            ))}
            {deck.tickets.length===0 && <li className="muted">No tickets yet.</li>}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="font-medium mb-2">Documents</div>
            {(isCoach || isAdmin) && <DocCreateForm deckId={deck.id} />}
            <ul className="text-sm list-disc ml-4 mt-2">
              {deck.documents.map((d) => (
                <li key={d.id}>
                  {d.url ? <a className="underline" href={d.url} target="_blank">{d.title}</a> : d.title}
                </li>
              ))}
              {deck.documents.length===0 && <li className="muted">No documents yet.</li>}
            </ul>
          </div>

          <div className="card">
            <div className="font-medium mb-2">Recent Progress</div>
            <ul className="text-sm list-disc ml-4">
              {deck.progress.map((p) => (
                <li key={p.id}>{new Date(p.weekStart).toDateString()} — {p.summary}</li>
              ))}
              {deck.progress.length===0 && <li className="muted">No progress yet.</li>}
            </ul>
            {(isCoach || isAdmin) && (
              <a className="btn mt-2" href={"/decks/"+deck.id+"/progress/new"}>Add Progress</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
