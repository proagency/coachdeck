import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Landing() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return (
      <div className="card">
        <div className="muted">You're signed in. Redirecting…</div>
        <meta httpEquiv="refresh" content="0; url=/decks" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero with 16:9 YouTube */}
      <section className="text-center">
        <h1 className="text-3xl font-semibold mb-2">CoachDeck</h1>
        <p className="muted">A minimalist workspace for coaches and students.</p>
        <div className="relative pt-[56.25%] mt-6 max-w-3xl mx-auto">
          <iframe className="absolute inset-0 w-full h-full rounded border"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="CoachDeck Intro" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </section>

      {/* Three things */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <h3 className="font-medium">Create your deck</h3>
          <p className="muted text-sm">One coach ↔ one student, focused.</p>
          <Link className="btn-primary mt-2 justify-center" href="/signin">Get Started for Free</Link>
        </div>
        <div className="card text-center">
          <h3 className="font-medium">Micro tickets</h3>
          <p className="muted text-sm">Ask questions, track status, reply fast.</p>
          <Link className="btn-primary mt-2 justify-center" href="/signin">Get Started for Free</Link>
        </div>
        <div className="card text-center">
          <h3 className="font-medium">Payments</h3>
          <p className="muted text-sm">Plans, invoices, proof uploads.</p>
          <Link className="btn-primary mt-2 justify-center" href="/signin">Get Started for Free</Link>
        </div>
      </section>

      <footer className="text-center text-sm muted">
        CoachDeck v1.0.6 {new Date().getFullYear()}
      </footer>
    </div>
  );
}
