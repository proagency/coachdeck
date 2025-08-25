// rebuild.js
// Run with: node rebuild.js
import { promises as fs } from "fs";
import path from "path";

const W = async (file, content) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
  console.log("✓ wrote", file);
};

const schema = `generator client { 
  provider = "prisma-client-js" 
}
datasource db { 
  provider = "postgresql"
  url = env("DATABASE_URL") 
}

enum AccessLevel { 
  ADMIN 
  USER 
}
enum Role { 
  SUPER_ADMIN 
  COACH 
  STUDENT 
}
enum UserStatus { 
  PENDING 
  ACTIVE 
  DISABLED 
}
enum TicketStatus { 
  OPEN 
  IN_PROGRESS 
  RESOLVED 
  CLOSED 
}
enum TicketPriority { 
  LOW 
  MEDIUM 
  HIGH 
}
enum PlanTier { 
  FREE 
  STARTER 
  PRO 
}
enum BillingTerm { 
  NONE 
  MONTHLY 
  YEARLY 
}

enum PaymentType { ONE_TIME SUBSCRIPTION }
enum PaymentChannel { BANK E_WALLET }
enum InvoiceStatus { PENDING SUBMITTED UNDER_REVIEW PAID REJECTED CANCELED }

model User {
  id            String       @id @default(cuid())
  name          String?
  phone         String?
  email         String?      @unique
  image         String?
  emailVerified DateTime?
  accessLevel   AccessLevel  @default(USER)
  role          Role         @default(STUDENT)
  status        UserStatus   @default(ACTIVE)
  createdAt     DateTime     @default(now())

  decks             Deck[]          @relation("CoachDecks")
  memberships       Membership[]
  tickets           Ticket[]        @relation("AuthorTickets")
  assigned          Ticket[]        @relation("AssignedTickets")
  comments          TicketComment[]
  documents         Document[]      @relation("AuthorDocs")
  progress          ProgressEntry[] @relation("AuthorProgress")
  invitesCreated    Invite[]        @relation("InvitesCreatedBy")
  invitesAccepted   Invite[]        @relation("InvitesAcceptedBy")

  coachPaymentsConfig CoachPaymentsConfig?
  bankAccounts        CoachBankAccount[]
  ewallets            CoachEwallet[]
  paymentPlans        PaymentPlan[]
  invoicesAuthored    Invoice[] @relation("InvoiceStudent")
  invoicesForCoach    Invoice[] @relation("InvoiceCoach")

  accounts Account[]
  sessions Session[]
}

model Deck {
  id         String   @id @default(cuid())
  name       String
  coachId    String
  coach      User     @relation("CoachDecks", fields: [coachId], references: [id])
  createdAt  DateTime @default(now())

  membership Membership?
  documents  Document[]
  progress   ProgressEntry[]
  tickets    Ticket[]
  invites    Invite[]

  @@index([coachId])
}

model Membership {
  id        String   @id @default(cuid())
  deckId    String   @unique
  deck      Deck     @relation(fields: [deckId], references: [id])
  studentId String   @unique
  student   User     @relation(fields: [studentId], references: [id])
  createdAt DateTime @default(now())
}

model Invite {
  id           String   @id @default(cuid())
  deckId       String
  deck         Deck     @relation(fields: [deckId], references: [id])
  email        String
  token        String   @unique
  expiresAt    DateTime

  createdById  String
  createdBy    User     @relation("InvitesCreatedBy", fields: [createdById], references: [id])

  acceptedById String?
  acceptedBy   User?    @relation("InvitesAcceptedBy", fields: [acceptedById], references: [id])
  acceptedAt   DateTime?

  @@index([deckId])
  @@index([token])
}

model Document {
  id          String   @id @default(cuid())
  deckId      String
  deck        Deck     @relation(fields: [deckId], references: [id])
  title       String
  url         String?
  content     String   @default("")
  createdById String
  createdBy   User     @relation("AuthorDocs", fields: [createdById], references: [id])
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@index([deckId])
}

model ProgressEntry {
  id          String   @id @default(cuid())
  deckId      String
  deck        Deck     @relation(fields: [deckId], references: [id])
  authorId    String
  author      User     @relation("AuthorProgress", fields: [authorId], references: [id])
  weekStart   DateTime
  metrics     Json?
  summary     String
  blockers    String?
  nextActions String?
  createdAt   DateTime @default(now())

  @@unique([deckId, weekStart])
  @@index([deckId, weekStart])
}

model Ticket {
  id           String         @id @default(cuid())
  deckId       String
  deck         Deck           @relation(fields: [deckId], references: [id])
  authorId     String
  author       User           @relation("AuthorTickets", fields: [authorId], references: [id])
  assignedToId String?
  assignedTo   User?          @relation("AssignedTickets", fields: [assignedToId], references: [id])
  title        String
  body         String
  status       TicketStatus   @default(OPEN)
  priority     TicketPriority @default(MEDIUM)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  comments     TicketComment[]

  @@index([deckId])
  @@index([status])
}

model TicketComment {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  body      String
  createdAt DateTime @default(now())

  @@index([ticketId])
}

model CoachPaymentsConfig {
  id            String   @id @default(cuid())
  coachId       String   @unique
  coach         User     @relation(fields: [coachId], references: [id], onDelete: Cascade)
  enableBank    Boolean  @default(false)
  enableEwallet Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model CoachBankAccount {
  id            String   @id @default(cuid())
  coachId       String
  coach         User     @relation(fields: [coachId], references: [id], onDelete: Cascade)
  bankName      String
  accountName   String
  accountNumber String
  branch        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([coachId])
}

model CoachEwallet {
  id        String   @id @default(cuid())
  coachId   String
  coach     User     @relation(fields: [coachId], references: [id], onDelete: Cascade)
  provider  String
  handle    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([coachId])
}

model PaymentPlan {
  id          String       @id @default(cuid())
  coachId     String
  coach       User         @relation(fields: [coachId], references: [id], onDelete: Cascade)
  name        String
  description String?
  type        PaymentType
  amount      Int
  currency    String       @default("PHP")
  active      Boolean      @default(true)
  invoices    Invoice[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([coachId])
}

model Invoice {
  id         String         @id @default(cuid())
  coachId    String
  coach      User           @relation("InvoiceCoach", fields: [coachId], references: [id], onDelete: Cascade)
  studentId  String
  student    User           @relation("InvoiceStudent", fields: [studentId], references: [id], onDelete: Cascade)
  planId     String?
  plan       PaymentPlan?   @relation(fields: [planId], references: [id])
  title      String
  description String?
  amount     Int
  currency   String         @default("PHP")
  channel    PaymentChannel
  status     InvoiceStatus  @default(PENDING)
  proofKey   String?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  @@index([coachId])
  @@index([studentId])
  @@index([status])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
`;

const seedTs = `import { PrismaClient, AccessLevel, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "melenciojrl@gmail.com";
  const passwordHash = await bcrypt.hash("Admin12345!", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { accessLevel: AccessLevel.ADMIN, role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, name: "Super Admin" },
    create: { email: adminEmail, accessLevel: AccessLevel.ADMIN, role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, name: "Super Admin", passwordHash },
  });

  console.log("Seeded Super Admin:", adminEmail);
}

main().finally(() => prisma.$disconnect());
`;

const dbTs = `import { PrismaClient } from "@prisma/client";
const g = global as any;
export const prisma: PrismaClient = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
`;

const authTs = `import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !(user as any).passwordHash) return null;
        const ok = await bcrypt.compare(creds.password, (user as any).passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name ?? "", email: user.email ?? "", image: user.image ?? "", role: user.role, accessLevel: user.accessLevel };
      },
    }),
  ],
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.accessLevel = (user as any).accessLevel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accessLevel = token.accessLevel;
      }
      return session;
    },
  },
};
`;

const authRoute = `import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
`;

const layoutTsx = `import "./../styles/globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ToastHub from "@/components/ui/ToastHub";

export const metadata = { title: "CoachDeck", description: "Minimal 1:1 coaching workspace" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  function NavFor(user: any) {
    const items: { href: string; label: string }[] = [];
    if (user) {
      items.push({ href: "/profile", label: "Profile" });
      items.push({ href: "/decks", label: "Decks" });
      items.push({ href: "/tickets", label: "Tickets" });
      if (user.accessLevel === "ADMIN") items.push({ href: "/approvals", label: "Approvals" });
      items.push({ href: "/plans", label: "Plans & Billing" });
      items.push({ href: "/api/auth/signout?callbackUrl=/", label: "Sign out" });
    } else {
      items.push({ href: "/signin", label: "Sign in" });
      items.push({ href: "/signup", label: "Sign up" });
    }
    return items;
  }

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="container max-w-6xl p-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">CoachDeck</Link>
            <details className="relative">
              <summary className="list-none cursor-pointer p-2 rounded-[3px] border hover:bg-gray-50" aria-label="User menu">
                {/* user icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-[3px] border bg-white shadow p-2 grid">
                {NavFor(user).map((it) => (
                  <Link key={it.href} href={it.href} className="px-2 py-2 rounded-[3px] hover:bg-gray-100">{it.label}</Link>
                ))}
              </div>
            </details>
          </div>
        </header>
        <main className="container max-w-6xl p-6">{children}</main>
        <ToastHub />
      </body>
    </html>
  );
}
`;

const toastHub = `"use client";
import React from "react";

type Toast = { id: string; msg: string; kind?: "success"|"error"|"info" };

export default function ToastHub() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  React.useEffect(() => {
    function onToast(e: any) {
      const t: Toast = { id: crypto.randomUUID(), msg: e.detail?.msg ?? "", kind: e.detail?.kind ?? "info" };
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter(x => x.id !== t.id)), e.detail?.timeout ?? 2500);
    }
    (window as any).addEventListener("toast", onToast);
    return () => (window as any).removeEventListener("toast", onToast);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id}
          className={"rounded-[3px] border px-3 py-2 shadow bg-white text-sm " + 
            (t.kind==="success"?"border-green-500":"") + 
            (t.kind==="error"?" border-red-500":"") +
            (t.kind==="info"?" border-blue-500":"")}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
`;

const homePage = `import Link from "next/link";
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
`;

const loadingTsx = `export default function Loading() {
  return (
    <div className="w-full py-16 flex items-center justify-center">
      <div className="animate-spin h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600" />
    </div>
  );
}
`;

const coachPaymentsPage = `import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CoachPaymentsSidebar from "@/components/payments/CoachPaymentsSidebar";
import CoachPaymentsConfigForm from "@/components/payments/CoachPaymentsConfigForm";
import CoachBanks from "@/components/payments/CoachBanks";
import CoachEwallets from "@/components/payments/CoachEwallets";
import CoachPlansForm from "@/components/payments/CoachPlansForm";
import CoachInvoicesTable from "@/components/payments/CoachInvoicesTable";

export const metadata = { title: "Payments — Coach" };

export default async function CoachPaymentsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return null;

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return null;

  const cfg = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: {}, create: { coachId: me.id } });
  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const wallets = await prisma.coachEwallet.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const plans = await prisma.paymentPlan.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const invoices = await prisma.invoice.findMany({ where: { coachId: me.id }, include: { student: true, plan: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="relative">
      <CoachPaymentsSidebar />
      <div className="lg:ml-56 space-y-6">
        <h1 className="text-2xl font-semibold">Payments</h1>

        <section id="toggles" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Payment Toggles</div>
          <CoachPaymentsConfigForm cfg={cfg} />
        </section>

        <section id="banks" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Bank Accounts</div>
          <CoachBanks initial={banks} />
        </section>

        <section id="ewallets" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">E-Wallets</div>
          <CoachEwallets initial={wallets} />
        </section>

        <section id="plans" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Plans</div>
          <CoachPlansForm initial={plans} />
        </section>

        <section id="invoices" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Invoices</div>
          <CoachInvoicesTable invoices={invoices} />
        </section>
      </div>
    </div>
  );
}
`;

const sidebarTsx = `"use client";
import React from "react";

export default function CoachPaymentsSidebar() {
  const [open, setOpen] = React.useState(false);
  const items = [
    { href: "#toggles", label: "Payment Toggles" },
    { href: "#banks", label: "Bank Accounts" },
    { href: "#ewallets", label: "E-Wallets" },
    { href: "#plans", label: "Plans" },
    { href: "#invoices", label: "Invoices" },
  ];
  function scrollTo(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const id = (e.currentTarget.getAttribute("href") || "").replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }
  return (
    <>
      {/* Desktop: fixed floating */}
      <nav className="hidden lg:block fixed left-4 top-28 w-48 rounded-[3px] border bg-white shadow p-2">
        <div className="text-sm font-medium mb-2">Payments</div>
        <ul className="grid gap-1">
          {items.map(it => (
            <li key={it.href}><a href={it.href} onClick={scrollTo} className="block px-2 py-2 rounded-[3px] hover:bg-gray-100">{it.label}</a></li>
          ))}
        </ul>
      </nav>

      {/* Mobile: burger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed left-4 bottom-4 z-40 rounded-[3px] border bg-white shadow px-3 py-2">
        ☰ Payments
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30" onClick={()=>setOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow p-3" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Payments</div>
              <button onClick={()=>setOpen(false)} className="rounded-[3px] border px-2 py-1">✕</button>
            </div>
            <ul className="grid gap-1">
              {items.map(it => (
                <li key={it.href}><a href={it.href} onClick={scrollTo} className="block px-2 py-2 rounded-[3px] hover:bg-gray-100">{it.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
`;

const cfgFormTsx = `"use client";
import React from "react";

export default function CoachPaymentsConfigForm({ cfg }: any) {
  const [state, setState] = React.useState({ enableBank: cfg.enableBank, enableEwallet: cfg.enableEwallet });
  async function save() {
    const r = await fetch("/api/coach-payments/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
    if (r.ok) (window as any).dispatchEvent(new CustomEvent("toast", { detail: { kind: "success", msg: "Saved" } }));
    else (window as any).dispatchEvent(new CustomEvent("toast", { detail: { kind: "error", msg: "Save failed" } }));
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.enableBank} onChange={(e)=>setState(s=>({ ...s, enableBank: e.target.checked }))}/> Enable Bank Transfer</label>
      <label className="inline-flex items-center gap-2"><input type="checkbox" checked={state.enableEwallet} onChange={(e)=>setState(s=>({ ...s, enableEwallet: e.target.checked }))}/> Enable E-Wallet</label>
      <button onClick={save} className="btn self-start border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Save</button>
    </div>
  );
}
`;

const banksTsx = `"use client";
import React from "react";

type Bank = { id:string; bankName:string; accountName:string; accountNumber:string; branch?:string };

export default function CoachBanks({ initial }: { initial: Bank[] }) {
  const [items, setItems] = React.useState<Bank[]>(initial || []);
  const [draft, setDraft] = React.useState({ bankName:"", accountName:"", accountNumber:"", branch:"" });

  async function add() {
    if (items.length >= 5) { (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Max 5 banks"}})); return; }
    const r = await fetch("/api/coach-payments/banks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    if (r.ok) {
      const j = await r.json(); setItems([j.bank, ...items]);
      setDraft({ bankName:"", accountName:"", accountNumber:"", branch:"" });
      (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Bank added"}}));
    } else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }
  async function remove(id:string) {
    const r = await fetch("/api/coach-payments/banks/"+id, { method:"DELETE" });
    if (r.ok) { setItems(items.filter(x=>x.id!==id)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Removed"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-2">
        <label className="label">Bank Name<input className="input" value={draft.bankName} onChange={e=>setDraft({...draft, bankName:e.target.value})} /></label>
        <label className="label">Account Name<input className="input" value={draft.accountName} onChange={e=>setDraft({...draft, accountName:e.target.value})} /></label>
        <label className="label">Account Number<input className="input" value={draft.accountNumber} onChange={e=>setDraft({...draft, accountNumber:e.target.value})} /></label>
        <label className="label">Branch (optional)<input className="input" value={draft.branch} onChange={e=>setDraft({...draft, branch:e.target.value})} /></label>
      </div>
      <button onClick={add} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Add Bank</button>

      <ul className="text-sm divide-y">
        {items.map(b=>(
          <li key={b.id} className="py-2 flex items-center justify-between">
            <div><div className="font-medium">{b.bankName}</div><div className="muted">{b.accountName} — {b.accountNumber}{b.branch?(" — "+b.branch):""}</div></div>
            <button onClick={()=>remove(b.id)} className="btn">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

const walletsTsx = `"use client";
import React from "react";
type Wallet = { id:string; provider:string; handle:string };

export default function CoachEwallets({ initial }: { initial: Wallet[] }) {
  const [items, setItems] = React.useState<Wallet[]>(initial || []);
  const [draft, setDraft] = React.useState({ provider:"", handle:"" });

  async function add() {
    if (items.length >= 5) { (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Max 5 wallets"}})); return; }
    const r = await fetch("/api/coach-payments/ewallets", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    if (r.ok) { const j = await r.json(); setItems([j.wallet, ...items]); setDraft({ provider:"", handle:"" }); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"E-Wallet added"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }
  async function remove(id:string) {
    const r = await fetch("/api/coach-payments/ewallets/"+id, { method:"DELETE" });
    if (r.ok) { setItems(items.filter(x=>x.id!==id)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Removed"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-2">
        <label className="label">Provider<input className="input" value={draft.provider} onChange={e=>setDraft({...draft, provider:e.target.value})} /></label>
        <label className="label">Handle<input className="input" value={draft.handle} onChange={e=>setDraft({...draft, handle:e.target.value})} placeholder="Phone / username" /></label>
      </div>
      <button onClick={add} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Add E-Wallet</button>

      <ul className="text-sm divide-y">
        {items.map(w=>(
          <li key={w.id} className="py-2 flex items-center justify-between">
            <div><div className="font-medium">{w.provider}</div><div className="muted">{w.handle}</div></div>
            <button onClick={()=>remove(w.id)} className="btn">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

const plansTsx = `"use client";
import React from "react";

type Plan = { id:string; name:string; description?:string|null; type:"ONE_TIME"|"SUBSCRIPTION"; amount:number; currency:string; active:boolean };

export default function CoachPlansForm({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = React.useState<Plan[]>(initial || []);
  const [draft, setDraft] = React.useState<Plan>({ id:"", name:"", description:"", type:"ONE_TIME", amount:0, currency:"PHP", active:true });

  async function create() {
    const r = await fetch("/api/coach-payments/plans", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    if (r.ok) { const j = await r.json(); setPlans([j.plan, ...plans]); setDraft({ id:"", name:"", description:"", type:"ONE_TIME", amount:0, currency:"PHP", active:true}); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Plan created"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  async function update(p: Plan) {
    const r = await fetch("/api/coach-payments/plans/"+p.id, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(p) });
    if (r.ok) { const j = await r.json(); setPlans((prev)=>prev.map(x=>x.id===p.id?j.plan:x)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Plan updated"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  async function remove(id: string) {
    const r = await fetch("/api/coach-payments/plans/"+id, { method:"DELETE" });
    if (r.ok) { setPlans(plans.filter(x=>x.id!==id)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Deleted"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-2">
        <label className="label">Name<input className="input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
        <label className="label">Type
          <select className="input" value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as any})}>
            <option value="ONE_TIME">One-time</option>
            <option value="SUBSCRIPTION">Subscription</option>
          </select>
        </label>
        <label className="label">Amount (₱)
          <input className="input" type="number" min={0} value={draft.amount} onChange={e=>setDraft({...draft,amount:parseInt(e.target.value||"0")})}/>
        </label>
        <label className="label md:col-span-3">Description
          <textarea className="input" value={draft.description ?? ""} onChange={e=>setDraft({...draft,description:e.target.value})} />
        </label>
      </div>
      <button onClick={create} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Create Plan</button>

      <ul className="divide-y">
        {plans.map(p=>(
          <li key={p.id} className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.name} <span className="muted">({p.type === "ONE_TIME" ? "One-time" : "Subscription"})</span></div>
              <div className="flex items-center gap-2">
                <button onClick={()=>remove(p.id)} className="btn">Delete</button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <label className="label">Amount (₱)
                <input className="input" type="number" min={0} defaultValue={p.amount} onChange={e=>p.amount=parseInt(e.target.value||"0")} />
              </label>
              <label className="label">Currency
                <input className="input" defaultValue={p.currency} onChange={e=>p.currency=e.target.value} />
              </label>
              <label className="label">Active
                <select className="input" defaultValue={p.active ? "1":"0"} onChange={e=>p.active=e.target.value==="1"}>
                  <option value="1">Yes</option><option value="0">No</option>
                </select>
              </label>
              <label className="label md:col-span-3">Description
                <textarea className="input" defaultValue={p.description ?? ""} onChange={e=>p.description=e.target.value}/>
              </label>
            </div>
            <button onClick={()=>update(p)} className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">Save</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

const invoicesTableTsx = `"use client";
import React from "react";

type Invoice = { id:string; title:string; amount:number; currency:string; status:string; plan?:{ name:string|null }|null; student?:{ email:string|null }|null };

export default function CoachInvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const [items, setItems] = React.useState(invoices || []);
  async function setStatus(id:string, status:string){
    const r = await fetch(\`/api/invoices/\${id}/status\`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ status }) });
    if (r.ok){ const j = await r.json(); setItems(prev=>prev.map(x=>x.id===id?{...x,status:j.invoice.status}:x)); (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Status updated"}})); }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Update failed"}}));
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th className="py-2">Title</th><th>Student</th><th>Plan</th><th>Amount</th><th>Status</th><th/></tr></thead>
        <tbody>
          {items.map(inv=>(
            <tr key={inv.id} className="border-t">
              <td className="py-2">{inv.title}</td>
              <td>{inv.student?.email ?? "—"}</td>
              <td>{inv.plan?.name ?? "—"}</td>
              <td>₱{(inv.amount/1).toLocaleString()}</td>
              <td>{inv.status}</td>
              <td>
                <select className="input" defaultValue={inv.status} onChange={e=>setStatus(inv.id, e.target.value)}>
                  <option>PENDING</option><option>SUBMITTED</option><option>UNDER_REVIEW</option><option>PAID</option><option>REJECTED</option><option>CANCELED</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;

const apiCfg = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({ enableBank: z.boolean(), enableEwallet: z.boolean() });

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const cfg = await prisma.coachPaymentsConfig.upsert({
    where: { coachId: me.id },
    update: parsed.data,
    create: { coachId: me.id, ...parsed.data },
  });
  return NextResponse.json({ ok: true, cfg });
}
`;

const apiBanks = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  bankName: z.string().min(1),
  accountName: z.string().min(1),
  accountNumber: z.string().min(1),
  branch: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const count = await prisma.coachBankAccount.count({ where: { coachId: me.id } });
  if (count >= 5) return NextResponse.json({ error: "limit" }, { status: 400 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const bank = await prisma.coachBankAccount.create({ data: { coachId: me.id, ...parsed.data } });
  return NextResponse.json({ bank }, { status: 201 });
}
`;

const apiBankId = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.coachBankAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
`;

const apiWallets = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  provider: z.string().min(1),
  handle: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const count = await prisma.coachEwallet.count({ where: { coachId: me.id } });
  if (count >= 5) return NextResponse.json({ error: "limit" }, { status: 400 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const wallet = await prisma.coachEwallet.create({ data: { coachId: me.id, ...parsed.data } });
  return NextResponse.json({ wallet }, { status: 201 });
}
`;

const apiWalletId = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.coachEwallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
`;

const apiPlans = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["ONE_TIME","SUBSCRIPTION"]),
  amount: z.number().int().nonnegative(),
  currency: z.string().default("PHP"),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email } });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success || !me) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const plan = await prisma.paymentPlan.create({ data: { coachId: me.id, ...parsed.data } });
  return NextResponse.json({ plan }, { status: 201 });
}
`;

const apiPlanId = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await req.json();
  const plan = await prisma.paymentPlan.update({ where: { id }, data });
  return NextResponse.json({ plan });
}

export async function DELETE(_: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  await prisma.paymentPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
`;

const apiInvoiceUpload = `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "file_too_large" }, { status: 413 });

  const uploadDir = "/tmp/coachdeck-uploads";
  await mkdir(uploadDir, { recursive: true });
  const ext = (file.type?.split("/")[1] || "bin").toLowerCase();
  const key = \`\${id}-\${randomUUID()}.\${ext}\`;
  const filepath = join(uploadDir, key);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buf);

  const updated = await prisma.invoice.update({
    where: { id },
    data: { proofKey: filepath, status: "SUBMITTED" },
    select: { id: true, status: true, coachId: true, studentId: true, amount: true, currency: true, title: true },
  });

  return NextResponse.json({ ok: true, invoice: updated });
}
`;

const apiInvoiceStatus = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({ status: z.enum(["PENDING","SUBMITTED","UNDER_REVIEW","PAID","REJECTED","CANCELED"]) });

export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (inv.coachId !== me.id && (session.user as any).accessLevel !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.invoice.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ invoice: updated });
}
`;

const apiTicketComment = `import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
const Body = z.object({ body: z.string().min(1) });

export async function POST(req: NextRequest, ctx: any) {
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

  (async () => {
    try {
      const toEmail = isStudent ? ticket.deck.coach.email : ticket.deck.membership?.student?.email;
      if (toEmail && process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as any);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: toEmail,
          subject: \`New reply on ticket: \${ticket.title}\`,
          text: \`\${email} replied:\\n\\n\${parsed.data.body}\`,
        });
      }
    } catch {}
  })();

  return NextResponse.json({ comment }, { status: 201 });
}
`;

const apiTicketStatus = `import { NextRequest, NextResponse } from "next/server";
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
          subject: \`Ticket status updated: \${ticket.title}\`,
          text: \`Status is now: \${parsed.data.status}\`,
        });
      }
    } catch {}
  })();

  return NextResponse.json({ ticket: updated });
}
`;

const signinPage = `import SignInForm from "@/components/auth/SignInForm";
export const metadata = { title: "Sign in — CoachDeck" };
export default function SignInPage() { return <SignInForm />; }
`;

const signinForm = `"use client";
import React from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const [email, setEmail] = React.useState(""); 
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) { (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Signed in"}})); window.location.href="/decks"; }
    else (window as any).dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg: res?.error || "Failed"}}));
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="label">Password
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button className="btn border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" disabled={loading}>{loading?"Signing in…":"Sign in"}</button>
      </form>
    </div>
  );
}
`;

const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
html, body { height: 100%; }

.card { @apply rounded-[3px] border p-5 shadow-sm bg-white; }
.btn { @apply inline-flex items-center gap-2 rounded-[3px] border px-3 py-2 text-sm hover:shadow-sm transition bg-white; }
.input { @apply mt-1 w-full rounded-[3px] border px-3 py-2; }
.label { @apply block text-sm font-medium text-gray-700; }
.muted { @apply text-gray-600; }
`;

(async () => {
  await W("prisma/schema.prisma", schema);
  await W("prisma/seed.ts", seedTs);

  await W("lib/db.ts", dbTs);
  await W("lib/auth.ts", authTs);
  await W("app/api/auth/[...nextauth]/route.ts", authRoute);

  await W("app/layout.tsx", layoutTsx);
  await W("components/ui/ToastHub.tsx", toastHub);
  await W("app/page.tsx", homePage);
  await W("app/loading.tsx", loadingTsx);

  await W("app/(coach)/coach/payments/page.tsx", coachPaymentsPage);
  await W("components/payments/CoachPaymentsSidebar.tsx", sidebarTsx);
  await W("components/payments/CoachPaymentsConfigForm.tsx", cfgFormTsx);
  await W("components/payments/CoachBanks.tsx", banksTsx);
  await W("components/payments/CoachEwallets.tsx", walletsTsx);
  await W("components/payments/CoachPlansForm.tsx", plansTsx);
  await W("components/payments/CoachInvoicesTable.tsx", invoicesTableTsx);

  await W("app/api/coach-payments/config/route.ts", apiCfg);
  await W("app/api/coach-payments/banks/route.ts", apiBanks);
  await W("app/api/coach-payments/banks/[id]/route.ts", apiBankId);
  await W("app/api/coach-payments/ewallets/route.ts", apiWallets);
  await W("app/api/coach-payments/ewallets/[id]/route.ts", apiWalletId);
  await W("app/api/coach-payments/plans/route.ts", apiPlans);
  await W("app/api/coach-payments/plans/[id]/route.ts", apiPlanId);
  await W("app/api/invoices/[id]/upload/route.ts", apiInvoiceUpload);
  await W("app/api/invoices/[id]/status/route.ts", apiInvoiceStatus);
  await W("app/api/tickets/[id]/comments/route.ts", apiTicketComment);
  await W("app/api/tickets/[id]/status/route.ts", apiTicketStatus);

  await W("app/(auth)/signin/page.tsx", signinPage);
  await W("components/auth/SignInForm.tsx", signinForm);

  await W("styles/globals.css", globalsCss);

  console.log("\\nAll done. Next steps:");
  console.log("1) npx prisma format && npx prisma generate");
  console.log("2) npx prisma migrate dev --name rebuild_fix");
  console.log("3) npm run dev");
  console.log("4) (optional) npm run seed");
})();
