import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DecksPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return <div className="space-y-4"><h1 className="text-2xl font-semibold">Your Decks</h1><p>Please <a className="underline" href="/signin">sign in</a>.</p></div>;

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return null;

  const decks = await prisma.deck.findMany({
    where: { OR: [{ coachId: me.id }, { membership: { studentId: me.id } }] },
    include: { membership: { include: { student: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Decks</h1>
        {me.role==="COACH" && (
          <form className="flex gap-2" action="/api/decks" method="post">
            <input className="input" name="name" placeholder="New deck name" required />
            <input className="input" type="email" name="studentEmail" placeholder="Student email" required />
            <button className="btn-primary">Create</button>
          </form>
        )}
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {decks.map((d) => (
          <li key={d.id} className="card">
            <div className="font-medium">{d.name}</div>
            <div className="text-sm muted">{d.membership?.student ? `Student: ${d.membership.student.email}` : "No student yet"}</div>
            <div className="mt-3">
              <a className="btn" href={"/decks/"+d.id}>Open</a>
            </div>
          </li>
        ))}
        {decks.length===0 && <li className="muted">No decks yet.</li>}
      </ul>
    </div>
  );
}
