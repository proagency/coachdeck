import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Landing() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    // Redirect signed-in users to /decks
    return (
      <div className="text-center space-y-6">
        <p className="text-lg">You're signed in. Redirecting to your decks…</p>
        <a className="btn" href="/decks">Go now</a>
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl font-semibold">CoachDeck</h1>
        <p className="muted">A minimalist workspace for coaches and students.</p>
        <div className="relative mx-auto max-w-3xl aspect-video rounded-[3px] overflow-hidden border shadow">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="CoachDeck"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
        <div className="flex gap-3 justify-center">
          <Link className="btn hover:bg-blue-600 hover:text-white border-blue-600 text-blue-600" href="/signin">Get Started for Free</Link>
        </div>
      </section>

      {/* Three things */}
      <section className="grid md:grid-cols-3 gap-4">
        {[
          { t: "Create Decks", d: "One coach ↔ one student, simple and focused." },
          { t: "Track Tickets", d: "Micro-consultations with statuses & email alerts." },
          { t: "Share Docs", d: "Add a working file URL + booking link." },
        ].map((x) => (
          <div key={x.t} className="card">
            <div className="font-medium">{x.t}</div>
            <div className="muted">{x.d}</div>
            <div className="mt-3"><Link className="btn hover:bg-blue-600 hover:text-white border-blue-600 text-blue-600" href="/signin">Get Started for Free</Link></div>
          </div>
        ))}
      </section>

      <footer className="text-center text-sm muted">CoachDeck v1.0.6 {year}</footer>
    </div>
  );
}
