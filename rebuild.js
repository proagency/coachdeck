// rebuild.js
// Rebuild a full CoachDeck repo from scratch.
// Run: node rebuild.js

const fs = require("fs");
const path = require("path");

function w(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trimStart(), "utf8");
  console.log("• wrote", file);
}

function a(file, content) {
  fs.appendFileSync(file, content, "utf8");
  console.log("• appended", file);
}

const PKG = `
{
  "name": "coachdeck",
  "private": true,
  "version": "1.0.6",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "prisma:deploy": "prisma migrate deploy",
    "seed": "node --loader ts-node/esm prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "6.14.0",
    "bcryptjs": "^2.4.3",
    "next": "15.5.0",
    "next-auth": "4.24.11",
    "nodemailer": "^6",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.14.12",
    "@types/react": "19.1.10",
    "autoprefixer": "^10",
    "postcss": "^8",
    "prisma": "6.14.0",
    "tailwindcss": "^3",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0"
  },
  "engines": { "node": ">=18.18.0" }
}
`;

const TSCONFIG = `
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "types": ["node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`;

const POSTCSS = `
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
`;

const TAILWIND = `
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#155EEF", hover: "#0B4BDD" }
      },
      container: { center: true, padding: "1rem" },
      borderRadius: { DEFAULT: "3px" }
    }
  },
  plugins: [],
} satisfies Config;
`;

const GLOBALS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
html, body { height: 100%; }
html { scroll-behavior: smooth; }

.card { @apply rounded border p-5 shadow-sm bg-white; }
.btn { @apply inline-flex items-center gap-2 rounded border px-3 py-2 text-sm transition bg-white hover:bg-gray-50; }
.btn-primary { @apply inline-flex items-center gap-2 rounded border px-3 py-2 text-sm bg-brand text-white border-brand hover:bg-white hover:text-brand; }
.input { @apply mt-1 w-full rounded border px-3 py-2; }
.label { @apply block text-sm font-medium text-gray-700; }
.muted { @apply text-gray-600; }

/* Toast: bottom-right */
.toast-wrap { position: fixed; right: 16px; bottom: 16px; z-index: 50; display: grid; gap: 8px; }
.toast { @apply rounded border bg-white shadow-sm px-3 py-2 text-sm; }
.toast.success { @apply border-green-600; }
.toast.error { @apply border-red-600; }
`;

const ENV_EXAMPLE = `
# Copy to .env.local and set values
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=REPLACE_ME

# SMTP (Mailgun example)
EMAIL_SERVER=smtp://postmaster@mg.yourdomain.com:YOUR_SMTP_PASSWORD@smtp.mailgun.org:587
EMAIL_FROM="CoachDeck <no-reply@mg.yourdomain.com>"
`;

const GITIGNORE = `
node_modules/
.next/
out/
dist/
*.log
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
.vscode/
.turbo/
.cache/
uploads/
`;

const PRISMA_SCHEMA = `
generator client { 
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

enum PlanType { ONE_TIME SUBSCRIPTION }
enum PaymentChannel { BANK E_WALLET }
enum InvoiceStatus { PENDING AWAITING_PROOF UNDER_REVIEW PAID REJECTED }

model AppConfig {
  id                 String   @id @default("app")
  starterMonthly     Int      @default(0)
  starterYearly      Int      @default(0)
  proMonthly         Int      @default(0)
  proYearly          Int      @default(0)
  xenditApiKey       String?
  xenditAccountId    String?
  checkoutWebhookUrl String?
  currency           String   @default("PHP")
  updatedAt          DateTime @updatedAt
}

model User {
  id            String       @id @default(cuid())
  name          String?
  email         String?      @unique
  passwordHash  String?
  phone         String?
  image         String?
  emailVerified DateTime?
  accessLevel   AccessLevel  @default(USER)
  role          Role         @default(STUDENT)
  status        UserStatus   @default(PENDING)
  planTier      PlanTier     @default(FREE)
  planTerm      BillingTerm  @default(NONE)
  createdAt     DateTime     @default(now())

  bookingUrl    String?
  bookingLabel  String?

  paymentsConfig CoachPaymentsConfig?

  decks             Deck[]          @relation("CoachDecks")
  memberships       Membership[]
  tickets           Ticket[]        @relation("AuthorTickets")
  assigned          Ticket[]        @relation("AssignedTickets")
  comments          TicketComment[]
  documents         Document[]      @relation("AuthorDocs")
  progress          ProgressEntry[] @relation("AuthorProgress")
  invoicesAsStudent Invoice[]       @relation("StudentInvoices")
  invoicesAsCoach   Invoice[]       @relation("CoachInvoices")

  resetTokens PasswordResetToken[]
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}

model CoachPaymentsConfig {
  id            String  @id @default(cuid())
  coachId       String  @unique
  coach         User    @relation(fields: [coachId], references: [id], onDelete: Cascade)
  enableBank    Boolean @default(false)
  enableEwallet Boolean @default(false)
  bankAccounts  CoachBankAccount[]
  ewallets      CoachEwallet[]
  plans         PaymentPlan[]
  updatedAt     DateTime @updatedAt
}

model CoachBankAccount {
  id            String  @id @default(cuid())
  coachId       String
  coach         User    @relation(fields: [coachId], references: [id], onDelete: Cascade)
  bankName      String
  bankBranch    String?
  accountName   String
  accountNumber String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([coachId])
}

model CoachEwallet {
  id            String  @id @default(cuid())
  coachId       String
  coach         User    @relation(fields: [coachId], references: [id], onDelete: Cascade)
  provider      String
  accountName   String
  accountNumber String
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([coachId])
}

model PaymentPlan {
  id          String   @id @default(cuid())
  coachId     String
  coach       User     @relation(fields: [coachId], references: [id], onDelete: Cascade)
  name        String
  description String?
  type        PlanType
  amountCents Int
  currency    String   @default("PHP")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  invoices    Invoice[]
  @@index([coachId, active])
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
  invoices   Invoice[]

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

model Invoice {
  id            String          @id @default(cuid())
  planId        String
  plan          PaymentPlan     @relation(fields: [planId], references: [id], onDelete: Restrict)
  coachId       String
  coach         User            @relation("CoachInvoices", fields: [coachId], references: [id], onDelete: Cascade)
  studentId     String
  student       User            @relation("StudentInvoices", fields: [studentId], references: [id], onDelete: Cascade)
  deckId        String?
  deck          Deck?           @relation(fields: [deckId], references: [id], onDelete: SetNull)

  channel       PaymentChannel
  amountCents   Int
  currency      String          @default("PHP")
  status        InvoiceStatus   @default(PENDING)

  proofUrl         String?
  proofUploadedAt  DateTime?

  notes         String?

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([coachId, status])
  @@index([studentId])
}
`;

const SEED_TS = `
import { PrismaClient, Role, AccessLevel, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "melenciojrl@gmail.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.SUPER_ADMIN, accessLevel: AccessLevel.ADMIN, status: UserStatus.ACTIVE, name: "Super Admin" },
    create: { email: adminEmail, name: "Super Admin", role: Role.SUPER_ADMIN, accessLevel: AccessLevel.ADMIN, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash("Admin12345!", 10) },
  });

  const coachEmail = "coach@example.com";
  const coach = await prisma.user.upsert({
    where: { email: coachEmail },
    update: { role: Role.COACH, status: UserStatus.ACTIVE, name: "Coach One" },
    create: { email: coachEmail, name: "Coach One", role: Role.COACH, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash("Coach12345!", 10) },
  });

  const studentEmail = "student@example.com";
  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: { role: Role.STUDENT, status: UserStatus.ACTIVE, name: "Student One" },
    create: { email: studentEmail, name: "Student One", role: Role.STUDENT, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash("Student12345!", 10) },
  });

  const deck = await prisma.deck.create({ data: { name: "Sample Deck", coachId: coach.id } });
  await prisma.membership.create({ data: { deckId: deck.id, studentId: student.id } });

  await prisma.coachPaymentsConfig.upsert({ where: { coachId: coach.id }, update: {}, create: { coachId: coach.id } });

  console.log({ admin: admin.email, coach: coach.email, student: student.email, deck: deck.name });
}

main().finally(()=>prisma.$disconnect());
`;

const LIB_DB = `
import { PrismaClient } from "@prisma/client";
const g = global as any;
export const prisma: PrismaClient = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
`;

const LIB_MAIL = `
import nodemailer from "nodemailer";
type MailArgs = { to: string; subject: string; text?: string; html?: string; fromOverride?: string };

export async function sendMail({ to, subject, text, html, fromOverride }: MailArgs) {
  const url = process.env.EMAIL_SERVER;
  const from = fromOverride || process.env.EMAIL_FROM || "CoachDeck <no-reply@example.com>";
  if (!url) { console.warn("[mail] EMAIL_SERVER not set; printing to console"); console.log({ to, subject, text, html }); return { ok: true, dev: true }; }
  const transporter = nodemailer.createTransport(url);
  try {
    if (process.env.NODE_ENV !== "production") { await transporter.verify().catch(()=>{}); }
    const info = await transporter.sendMail({ to, from, subject, text: text || "", html: html || (text ? \`<pre>\${text}</pre>\` : "") });
    console.log("[mail] sent", info.messageId);
    return { ok: true };
  } catch (e:any) { console.error("[mail] error", e?.message || e); return { ok: false, error: String(e?.message || e) }; }
}
`;

const LIB_AUTH = `
// NextAuth (Credentials) with JWT sessions
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "email-password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(creds) {
        const email = (creds?.email || "").toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.status !== "ACTIVE") return null;
        const ok = await bcrypt.compare(creds?.password || "", user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name || "", email: user.email || "", role: user.role, accessLevel: user.accessLevel, phone: user.phone || null } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = (user as any).id; token.role = (user as any).role; token.accessLevel = (user as any).accessLevel; token.phone = (user as any).phone || null; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).id = token.id; (session.user as any).role = token.role; (session.user as any).accessLevel = token.accessLevel; (session.user as any).phone = token.phone || null; }
      return session;
    },
  },
};
`;

const APP_LAYOUT = `
import "./../styles/globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import Toast from "@/components/Toast";

export const metadata = { title: "CoachDeck", description: "Minimal 1:1 coaching workspace" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-30">
          <div className="container max-w-6xl p-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">CoachDeck</Link>
            <UserMenu session={session} />
          </div>
        </header>
        <main className="container max-w-6xl p-6">{children}</main>
        <Toast />
      </body>
    </html>
  );
}
`;

const APP_LOADING = `
export default function Loading(){ return <div className="muted">Loading…</div>; }
`;

const HOME_PAGE = `
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
`;

const USER_MENU = `
"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function UserMenu({ session }: { session: any }) {
  const [open, setOpen] = useState(false);
  const links: {href:string;label:string;role?:string}[] = [
    { href: "/profile", label: "Profile" },
    { href: "/signin", label: "Sign in" },
    { href: "/signup", label: "Sign up" },
    { href: "/decks", label: "Decks" },
    { href: "/tickets", label: "Tickets" },
    { href: "/coach/payments", label: "Payments (Coach)", role: "COACH" },
    { href: "/admin/approvals", label: "Approvals", role: "SUPER_ADMIN" },
  ];
  const role = session?.user?.role;

  return (
    <div className="relative">
      <button className="btn" onClick={()=>setOpen(true)} aria-label="User menu">
        {/* user icon */}
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor"/></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}>
          <div className="absolute right-4 top-16 w-64 bg-white border rounded shadow p-3" onClick={(e)=>e.stopPropagation()}>
            <div className="font-medium mb-2">{session?.user?.email || "Guest"}</div>
            <nav className="space-y-1">
              {links
                .filter(l => !l.role || l.role === role)
                .filter(l => {
                  if (session?.user) {
                    // hide sign-in/up when logged in
                    return !["/signin","/signup"].includes(l.href);
                  } else {
                    // hide sign-out targets
                    return !["/decks","/tickets","/coach/payments","/admin/approvals"].includes(l.href);
                  }
                })
                .map(l => <a key={l.href} className="btn w-full justify-start" href={l.href}>{l.label}</a>)
              }
              {session?.user ? (
                <button className="btn w-full justify-start" onClick={()=>signOut({ callbackUrl: "/" })}>Sign out</button>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const TOAST = `
"use client";
import { useEffect, useRef, useState } from "react";

export default function Toast(){
  const [list, setList] = useState<{id:number;kind:"success"|"error";msg:string}[]>([]);
  const idRef = useRef(1);
  useEffect(()=>{
    function on(e:any){
      const d = e.detail || { kind:"success", msg:"Ok" };
      const id = idRef.current++;
      setList(prev => [...prev, { id, kind: d.kind, msg: d.msg }]);
      setTimeout(()=>setList(prev=>prev.filter(x=>x.id!==id)), 3500);
    }
    window.addEventListener("toast", on as any);
    return ()=>window.removeEventListener("toast", on as any);
  },[]);
  return (
    <div className="toast-wrap">
      {list.map(t => <div key={t.id} className={"toast "+t.kind}>{t.msg}</div>)}
    </div>
  );
}
`;

/* AUTH PAGES & ROUTES */

const SIGNIN = `
"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SignInPage() {
  const sp = useSearchParams();
  const pre = sp.get("email") || "";
  const [email, setEmail] = useState(pre);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (pre) setEmail(pre); }, [pre]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Welcome back!"}})); location.href="/decks"; }
    else { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:res?.error || "Sign in failed"}})); }
  }

  const forgotHref = useMemo(()=> email ? \`/forgot?email=\${encodeURIComponent(email)}\` : "/forgot", [email]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="card grid gap-3">
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="label">Password
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <div className="flex items-center justify-between">
          <a className="underline text-sm" href={forgotHref}>Forgot password?</a>
          <button className="btn-primary" disabled={loading}>{loading?"Signing in...":"Sign in"}</button>
        </div>
      </form>
    </div>
  );
}
`;

const SIGNUP = `
"use client";
import { useState } from "react";

export default function SignUpPage(){
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/auth/register", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, name, password }) });
    setBusy(false);
    if (r.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Submitted for approval"}})); location.href="/signin?email="+encodeURIComponent(email); }
    else { const j = await r.json().catch(()=>({error:"Failed"})); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:j.error||"Failed"}})); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Coach sign up</h1>
      <p className="muted text-sm">Super Admin approval is required before you can sign in.</p>
      <form onSubmit={onSubmit} className="card grid gap-3">
        <label className="label">Full name
          <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        </label>
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="label">Password
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={busy}>{busy?"Submitting…":"Create account"}</button>
      </form>
    </div>
  );
}
`;

const FORGOT = `
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  const sp = useSearchParams();
  const preset = sp.get("email") || "";
  const [email, setEmail] = useState(preset);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ if (preset) setEmail(preset); }, [preset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false);
    if (r.ok) { setSent(true); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Reset link sent if the email exists"}})); }
    else { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed to send link"}})); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <form onSubmit={submit} className="card grid gap-3">
        <label className="label">Email
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={loading || sent}>{loading ? "Sending..." : sent ? "Sent" : "Send reset link"}</button>
      </form>
    </div>
  );
}
`;

const RESET = `
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const email = sp.get("email") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (!token) window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Missing token"}})); }, [token]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (pw.length < 8) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Use 8+ characters"}})); return; }
    if (pw !== pw2) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Passwords do not match"}})); return; }
    setLoading(true);
    const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
    setLoading(false);
    if (r.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Password updated"}})); location.href = "/signin" + (email ? \`?email=\${encodeURIComponent(email)}\` : ""); }
    else { const j = await r.json().catch(()=>({error:"Failed"})); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:j.error || "Reset failed"}})); }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <form onSubmit={save} className="card grid gap-3">
        {email && <div className="muted text-sm">Resetting password for <b>{email}</b></div>}
        <label className="label">New password
          <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} required />
        </label>
        <label className="label">Confirm new password
          <input className="input" type="password" value={pw2} onChange={e=>setPw2(e.target.value)} required />
        </label>
        <button className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save new password"}</button>
      </form>
    </div>
  );
}
`;

const NEXTAUTH_ROUTE = `
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
`;

const REGISTER_ROUTE = `
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { Role, UserStatus } from "@prisma/client";

export async function POST(req: Request){
  const { email, name, password } = await req.json().catch(()=>({}));
  if (!email || !password || !name) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "email_taken" }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash: hash, role: Role.COACH, status: UserStatus.PENDING } });
  return NextResponse.json({ ok: true });
}
`;

const FORGOT_ROUTE = `
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json().catch(()=>({}));
  if (!email) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000*60*60);

  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });
  }

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = \`\${base}/reset-password?token=\${token}&email=\${encodeURIComponent(email)}\`;

  await sendMail({ to: email, subject: "Reset your CoachDeck password", text: \`Click this link to reset your password (valid 1h): \${link}\`, html: \`<p>Click to reset (valid 1h): <a href="\${link}">\${link}</a></p>\` });

  return NextResponse.json({ ok: true, sent: true });
}
`;

const RESET_ROUTE = `
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(()=>({}));
  if (!token || typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!rec) return NextResponse.json({ error: "invalid_or_used_token" }, { status: 400 });
  if (rec.expiresAt.getTime() < Date.now()) { await prisma.passwordResetToken.delete({ where: { token } }).catch(()=>{}); return NextResponse.json({ error: "token_expired" }, { status: 400 }); }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: hash } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: rec.userId } });
  return NextResponse.json({ ok: true });
}
`;

/* ADMIN APPROVALS */

const ADMIN_APPROVALS = `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Approvals" };

export default async function Approvals(){
  const session = await getServerSession(authOptions);
  const me = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email }}) : null;
  if (!me || me.role !== "SUPER_ADMIN") return notFound();

  const pending = await prisma.user.findMany({ where: { role: "COACH", status: "PENDING" }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Coach Approvals</h1>
      <ul className="space-y-2">
        {pending.map(u=>(
          <li key={u.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name} <span className="muted">({u.email})</span></div>
              <div className="muted text-xs">{u.createdAt.toDateString()}</div>
            </div>
            <div className="flex gap-2">
              <form action={"/api/admin/users/"+u.id+"/status"} method="post">
                <input type="hidden" name="status" value="ACTIVE" />
                <button className="btn">Approve</button>
              </form>
              <form action={"/api/admin/users/"+u.id+"/status"} method="post">
                <input type="hidden" name="status" value="DISABLED" />
                <button className="btn">Disable</button>
              </form>
            </div>
          </li>
        ))}
        {pending.length===0 && <li className="muted">No pending requests.</li>}
      </ul>
    </div>
  );
}
`;

const ADMIN_STATUS_ROUTE = `
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me || me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const status = String(form.get("status") || "");
  if (!["ACTIVE","DISABLED"].includes(status)) return NextResponse.json({ error: "bad_status" }, { status: 400 });
  await prisma.user.update({ where: { id: params.id }, data: { status: status as UserStatus } });
  return NextResponse.json({ ok: true });
}
`;

/* DECKS & TICKETS & DOCS (minimal but working) */

const DECKS_PAGE = `
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
            <div className="text-sm muted">{d.membership?.student ? \`Student: \${d.membership.student.email}\` : "No student yet"}</div>
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
`;

const DECK_DETAIL = `
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
`;

const PROGRESS_NEW = `
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
`;

const TICKET_ACTIONS = `
"use client";
import { useState } from "react";
type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export function TicketActions({ ticketId, current }: { ticketId: string; current: Status }) {
  const [status, setStatus] = useState<Status>(current);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStatus(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch(\`/api/tickets/\${ticketId}/status\`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    setSaving(false);
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Updated":"Failed"}}));
    if (r.ok) location.reload();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch(\`/api/tickets/\${ticketId}/comments\`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: comment }),
    });
    setSaving(false);
    if (r.ok) { setComment(""); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Reply sent"}})); location.reload(); }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Reply failed"}}));
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <form onSubmit={updateStatus} className="flex items-center gap-2">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option>
        </select>
        <button className="btn">Update</button>
      </form>
      <form onSubmit={addComment} className="flex items-center gap-2">
        <input className="input" placeholder="Write a reply…" value={comment} onChange={(e)=>setComment(e.target.value)} />
        <button className="btn">Reply</button>
      </form>
    </div>
  );
}
`;

const DOC_CREATE = `
"use client";
import { useState } from "react";

export function DocCreateForm({ deckId }: { deckId: string }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/documents", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deckId, title, url }),
    });
    if (res.ok) { setTitle(""); setUrl(""); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Document added"}})); location.reload(); }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed to add"}}));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input className="input" placeholder="File name" value={title} onChange={(e)=>setTitle(e.target.value)} required />
      <input className="input" placeholder="https://…" value={url} onChange={(e)=>setUrl(e.target.value)} />
      <button className="btn">Add Document</button>
    </form>
  );
}
`;

const API_DECKS = `
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request){
  const session = await getServerSession(authOptions);
  const meEmail = session?.user?.email || null;
  if (!meEmail) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: meEmail } });
  if (!me || me.role!=="COACH") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const name = String(form.get("name") || "");
  const studentEmail = String(form.get("studentEmail") || "");
  if (!name || !studentEmail) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  // create student if doesn't exist with temp password
  let student = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!student) {
    const tempPass = Math.random().toString(36).slice(2,10)+"A1!";
    const hash = await bcrypt.hash(tempPass, 10);
    student = await prisma.user.create({ data: { email: studentEmail, passwordHash: hash, role:"STUDENT", status: "ACTIVE" } });
    await sendMail({ to: studentEmail, subject: "Your CoachDeck account", text: \`Temp password: \${tempPass}\nSign in at \${process.env.NEXTAUTH_URL||"http://localhost:3000"}/signin?email=\${encodeURIComponent(studentEmail)}\` });
  }

  const deck = await prisma.deck.create({ data: { name, coachId: me.id } });
  await prisma.membership.create({ data: { deckId: deck.id, studentId: student.id } });

  return NextResponse.redirect(new URL("/decks/"+deck.id, req.url));
}
`;

const API_TICKETS_CREATE = `
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const content = req.headers.get("content-type") || "";
  const raw: any = content.includes("application/x-www-form-urlencoded")
    ? Object.fromEntries((await req.formData()).entries())
    : await req.json();

  const deck = await prisma.deck.findFirst({ where: { id: String(raw.deckId||""), membership: { studentId: me.id } }, include: { coach: true }});
  if (!deck) return NextResponse.json({ error: "not_in_deck" }, { status: 403 });

  const ticket = await prisma.ticket.create({ data: { deckId: deck.id, authorId: me.id, title: String(raw.title||""), body: String(raw.body||"") } });

  // email coach
  await sendMail({ to: deck.coach.email!, subject: "New ticket", text: \`A new ticket was created: \${ticket.title}\` });
  return NextResponse.json({ ticket }, { status: 201 });
}
`;

const API_TICKETS_STATUS = `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(()=>null);
  if (!body?.status) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const t = await prisma.ticket.findUnique({ where: { id: params.id }, include: { deck: { include: { membership: { include: { student: true } }, coach: true } } } });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const isCoach = t.deck.coachId === me.id;
  const isAuthor = t.authorId === me.id;
  const isAssignee = t.assignedToId === me.id;
  if (!isAdmin && !isCoach && !isAuthor && !isAssignee) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.ticket.update({ where: { id: t.id }, data: { status: body.status } });

  // email student
  if (t.deck.membership?.student?.email) {
    await sendMail({ to: t.deck.membership.student.email, subject: "Ticket status changed", text: \`Ticket "\${t.title}" is now \${updated.status}\` });
  }
  return NextResponse.json({ ticket: updated });
}
`;

const API_TICKETS_COMMENTS = `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await req.json().catch(()=>null);
  if (!data?.body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const t = await prisma.ticket.findUnique({ where: { id: params.id }, include: { deck: { include: { membership: { include: { student: true } }, coach: true } } } });
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const can = t.authorId===me.id || t.assignedToId===me.id || t.deck.coachId===me.id;
  if (!can) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const comment = await prisma.ticketComment.create({ data: { ticketId: t.id, authorId: me.id, body: data.body } });

  // notify the other party
  const to = me.id === t.deck.coachId ? t.deck.membership?.student?.email : t.deck.coach.email;
  if (to) await sendMail({ to, subject: "New ticket reply", text: \`New reply on: \${t.title} — \${data.body}\` });

  return NextResponse.json({ comment }, { status: 201 });
}
`;

const API_DOCS = `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const data = await req.json().catch(()=>null);
  if (!data?.deckId || !data?.title) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const isAdmin = (session.user as any).accessLevel === "ADMIN";
  const deck = await prisma.deck.findUnique({ where: { id: data.deckId } });
  if (!deck) return NextResponse.json({ error: "deck_not_found" }, { status: 404 });
  if (!isAdmin && deck.coachId !== me.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const doc = await prisma.document.create({ data: { deckId: deck.id, title: data.title, url: data.url || null, createdById: me.id } });
  return NextResponse.json({ document: doc }, { status: 201 });
}
`;

const API_PROGRESS = `
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
`;

/* PAYMENTS (coach & student) — compact version with essentials */

const COACH_PAY_PAGE = `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CoachPaymentsConfigForm from "@/components/coach/CoachPaymentsConfigForm";
import CoachPlansForm from "@/components/coach/CoachPlansForm";
import CoachInvoicesTable from "@/components/coach/CoachInvoicesTable";
import CoachBankList from "@/components/coach/CoachBankList";
import CoachEwalletList from "@/components/coach/CoachEwalletList";
import CoachPaymentsSidebar, { CoachPaymentsMobileBurger } from "@/components/coach/CoachPaymentsSidebar";

export const metadata = { title: "Payments — Coach" };
export const dynamic = "force-dynamic";

export default async function CoachPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id:true, role:true }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return notFound();

  const cfg = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: {}, create: { coachId: me.id } });
  const plans = await prisma.paymentPlan.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const invoices = await prisma.invoice.findMany({ where: { coachId: me.id }, include: { student:true, plan:true, deck:true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <CoachPaymentsMobileBurger />
      <CoachPaymentsSidebar />
      <section className="space-y-8 md:ml-[288px]">
        <section id="toggles" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Payment Toggles</div>
          <CoachPaymentsConfigForm cfg={cfg} />
        </section>
        <section id="banks" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Bank Accounts</div>
          <CoachBankList />
        </section>
        <section id="ewallets" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">E-Wallets</div>
          <CoachEwalletList />
        </section>
        <section id="plans" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Plans</div>
          <CoachPlansForm initial={plans} />
        </section>
        <section id="invoices" className="card space-y-3 scroll-mt-24">
          <div className="font-medium">Invoices</div>
          <CoachInvoicesTable invoices={invoices} />
        </section>
      </section>
    </div>
  );
}
`;

const COACH_PAY_COMPONENTS = {
  "components/coach/CoachPaymentsConfigForm.tsx": `
"use client";
import { useState, FormEvent } from "react";

export default function CoachPaymentsConfigForm({ cfg }: any) {
  const [state, setState] = useState({ enableBank: !!cfg.enableBank, enableEwallet: !!cfg.enableEwallet });
  async function save(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/coach/payments/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
    window.dispatchEvent(new CustomEvent("toast", { detail: { kind: res.ok ? "success" : "error", msg: res.ok ? "Saved" : "Save failed" } }));
    if (res.ok) location.reload();
  }
  return (
    <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
      <label className="label">Enable Bank Transfer
        <div className="mt-1"><input type="checkbox" checked={state.enableBank} onChange={e=>setState(s=>({...s, enableBank:e.target.checked}))} /></div>
      </label>
      <label className="label">Enable e-Wallet
        <div className="mt-1"><input type="checkbox" checked={state.enableEwallet} onChange={e=>setState(s=>({...s, enableEwallet:e.target.checked}))} /></div>
      </label>
      <div className="md:col-span-2"><button className="btn-primary">Save</button></div>
    </form>
  );
}
`,
  "components/coach/CoachBankList.tsx": `
"use client";
import { useEffect, useState } from "react";

export default function CoachBankList() {
  const [banks, setBanks] = useState<any[]>([]);
  const [draft, setDraft] = useState({ bankName:"", bankBranch:"", accountName:"", accountNumber:"" });
  async function load(){ const r = await fetch("/api/coach/payments/banks"); const j = await r.json(); setBanks(j.banks || []); }
  useEffect(()=>{ load(); }, []);
  async function add(e: React.FormEvent){
    e.preventDefault();
    const r = await fetch("/api/coach/payments/banks", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Added":"Failed"}}));
    if (r.ok){ setDraft({ bankName:"", bankBranch:"", accountName:"", accountNumber:"" }); load(); }
  }
  async function save(b:any){
    const r = await fetch("/api/coach/payments/banks", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(b) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Saved":"Save failed"}}));
  }
  async function del(id:string){
    const r = await fetch("/api/coach/payments/banks?id="+id, { method:"DELETE" });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Deleted":"Delete failed"}}));
    if (r.ok) load();
  }
  const maxed = banks.length >= 5;
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {banks.map((b)=>(
          <li key={b.id} className="border rounded p-3 grid md:grid-cols-5 gap-2 items-end">
            <label className="label">Bank
              <input className="input" value={b.bankName} onChange={e=>{ b.bankName=e.target.value; setBanks([...banks]); }} />
            </label>
            <label className="label">Branch
              <input className="input" value={b.bankBranch||""} onChange={e=>{ b.bankBranch=e.target.value; setBanks([...banks]); }} />
            </label>
            <label className="label">Account Name
              <input className="input" value={b.accountName} onChange={e=>{ b.accountName=e.target.value; setBanks([...banks]); }} />
            </label>
            <label className="label">Account No.
              <input className="input" value={b.accountNumber} onChange={e=>{ b.accountNumber=e.target.value; setBanks([...banks]); }} />
            </label>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>save(b)} type="button">Save</button>
              <button className="btn" onClick={()=>del(b.id)} type="button">Delete</button>
            </div>
          </li>
        ))}
        {banks.length===0 && <li className="muted">No bank accounts yet.</li>}
      </ul>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 items-end">
        <label className="label">Bank
          <input className="input" value={draft.bankName} onChange={e=>setDraft(s=>({...s, bankName:e.target.value}))} required />
        </label>
        <label className="label">Branch
          <input className="input" value={draft.bankBranch} onChange={e=>setDraft(s=>({...s, bankBranch:e.target.value}))} />
        </label>
        <label className="label">Account Name
          <input className="input" value={draft.accountName} onChange={e=>setDraft(s=>({...s, accountName:e.target.value}))} required />
        </label>
        <label className="label">Account No.
          <input className="input" value={draft.accountNumber} onChange={e=>setDraft(s=>({...s, accountNumber:e.target.value}))} required />
        </label>
        <button className="btn-primary" disabled={maxed}>{maxed ? "Limit reached" : "Add"}</button>
      </form>
    </div>
  );
}
`,
  "components/coach/CoachEwalletList.tsx": `
"use client";
import { useEffect, useState } from "react";

export default function CoachEwalletList() {
  const [items, setItems] = useState<any[]>([]);
  const [draft, setDraft] = useState({ provider:"", accountName:"", accountNumber:"", notes:"" });
  async function load(){ const r = await fetch("/api/coach/payments/ewallets"); const j = await r.json(); setItems(j.ewallets || []); }
  useEffect(()=>{ load(); }, []);
  async function add(e: React.FormEvent){
    e.preventDefault();
    const r = await fetch("/api/coach/payments/ewallets", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Added":"Failed"}}));
    if (r.ok){ setDraft({ provider:"", accountName:"", accountNumber:"", notes:"" }); load(); }
  }
  async function save(x:any){
    const r = await fetch("/api/coach/payments/ewallets", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(x) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Saved":"Save failed"}}));
  }
  async function del(id:string){
    const r = await fetch("/api/coach/payments/ewallets?id="+id, { method:"DELETE" });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Deleted":"Delete failed"}}));
    if (r.ok) load();
  }
  const maxed = items.length >= 5;
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((x)=>(
          <li key={x.id} className="border rounded p-3 grid md:grid-cols-5 gap-2 items-end">
            <label className="label">Provider
              <input className="input" value={x.provider} onChange={e=>{ x.provider=e.target.value; setItems([...items]); }} />
            </label>
            <label className="label">Account Name
              <input className="input" value={x.accountName} onChange={e=>{ x.accountName=e.target.value; setItems([...items]); }} />
            </label>
            <label className="label">Account Number
              <input className="input" value={x.accountNumber} onChange={e=>{ x.accountNumber=e.target.value; setItems([...items]); }} />
            </label>
            <label className="label md:col-span-1">Notes
              <input className="input" value={x.notes||""} onChange={e=>{ x.notes=e.target.value; setItems([...items]); }} />
            </label>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>save(x)} type="button">Save</button>
              <button className="btn" onClick={()=>del(x.id)} type="button">Delete</button>
            </div>
          </li>
        ))}
        {items.length===0 && <li className="muted">No e-wallets yet.</li>}
      </ul>
      <form onSubmit={add} className="grid md:grid-cols-5 gap-2 items-end">
        <label className="label">Provider
          <input className="input" value={draft.provider} onChange={e=>setDraft(s=>({...s, provider:e.target.value}))} required />
        </label>
        <label className="label">Account Name
          <input className="input" value={draft.accountName} onChange={e=>setDraft(s=>({...s, accountName:e.target.value}))} required />
        </label>
        <label className="label">Account Number
          <input className="input" value={draft.accountNumber} onChange={e=>setDraft(s=>({...s, accountNumber:e.target.value}))} required />
        </label>
        <label className="label md:col-span-1">Notes
          <input className="input" value={draft.notes} onChange={e=>setDraft(s=>({...s, notes:e.target.value}))} />
        </label>
        <button className="btn-primary" disabled={maxed}>{maxed ? "Limit reached" : "Add"}</button>
      </form>
    </div>
  );
}
`,
  "components/coach/CoachPlansForm.tsx": `
"use client";
import { useEffect, useState, FormEvent } from "react";
type Plan = { id:string; name:string; description?:string|null; type:"ONE_TIME"|"SUBSCRIPTION"; amountCents:number; active:boolean };

export default function CoachPlansForm({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initial || []);
  const [draft, setDraft] = useState({ name:"", description:"", type:"ONE_TIME", amount:"" });

  async function refresh(){ const r = await fetch("/api/coach/payments/plans"); const j = await r.json(); setPlans(j.plans || []); }
  async function add(e: FormEvent){ e.preventDefault();
    const res = await fetch("/api/coach/payments/plans", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ...draft, amount: Number(draft.amount||0) }) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:res.ok?"success":"error",msg:res.ok?"Plan added":"Failed"}}));
    if (res.ok){ setDraft({ name:"", description:"", type:"ONE_TIME", amount:"" }); refresh(); }
  }
  async function del(id: string){ const res = await fetch("/api/coach/payments/plans?id="+id, { method:"DELETE" }); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:res.ok?"success":"error",msg:res.ok?"Deleted":"Delete failed"}})); if (res.ok) refresh(); }
  async function save(p: Plan){ const res = await fetch("/api/coach/payments/plans", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id: p.id, name: p.name, description: p.description||"", type: p.type, amount: (p.amountCents/100), active: p.active }) }); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:res.ok?"success":"error",msg:res.ok?"Saved":"Save failed"}})); if (res.ok) refresh(); }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="grid md:grid-cols-4 gap-3">
        <label className="label md:col-span-2">Plan name
          <input className="input" value={draft.name} onChange={e=>setDraft(s=>({...s, name:e.target.value}))} required />
        </label>
        <label className="label">Type
          <select className="input" value={draft.type} onChange={e=>setDraft(s=>({...s, type:e.target.value}))}><option value="ONE_TIME">One-time</option><option value="SUBSCRIPTION">Subscription</option></select>
        </label>
        <label className="label">Amount (₱)
          <input className="input" type="number" min="0" step="0.01" value={draft.amount} onChange={e=>setDraft(s=>({...s, amount:e.target.value}))} required />
        </label>
        <label className="label md:col-span-4">Description (optional)
          <input className="input" value={draft.description} onChange={e=>setDraft(s=>({...s, description:e.target.value}))} />
        </label>
        <div className="md:col-span-4"><button className="btn-primary">Add Plan</button></div>
      </form>

      <ul className="space-y-2">
        {plans.map((p)=>(
          <li key={p.id} className="border rounded p-3 space-y-2">
            <div className="grid md:grid-cols-5 gap-2 items-end">
              <label className="label md:col-span-2">Name
                <input className="input" value={p.name} onChange={e=>{ p.name=e.target.value; setPlans([...plans]); }} />
              </label>
              <label className="label">Type
                <select className="input" value={p.type} onChange={e=>{ p.type=e.target.value as any; setPlans([...plans]); }}>
                  <option value="ONE_TIME">One-time</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                </select>
              </label>
              <label className="label">Amount (₱)
                <input className="input" type="number" min="0" step="0.01"
                  value={(p.amountCents/100).toString()}
                  onChange={e=>{ const v = Number(e.target.value || 0); p.amountCents = Math.round(v*100); setPlans([...plans]); }} />
              </label>
              <label className="label md:col-span-5">Description
                <input className="input" value={p.description || ""} onChange={e=>{ p.description=e.target.value; setPlans([...plans]); }} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className="label"><input type="checkbox" className="mr-2" checked={p.active} onChange={e=>{ p.active=e.target.checked; setPlans([...plans]); }} />Active</label>
              <div className="flex gap-2">
                <button className="btn" onClick={()=>save(p)} type="button">Save</button>
                <button className="btn" onClick={()=>del(p.id)} type="button">Delete</button>
              </div>
            </div>
          </li>
        ))}
        {plans.length===0 && <li className="muted">No plans yet.</li>}
      </ul>
    </div>
  );
}
`,
  "components/coach/CoachInvoicesTable.tsx": `
"use client";
export default function CoachInvoicesTable({ invoices }: any) {
  async function setStatus(id: string, status: string){
    const r = await fetch(\`/api/invoices/\${id}/status\`, { method:"PATCH", headers:{ "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    window.dispatchEvent(new CustomEvent("toast",{detail:{kind:r.ok?"success":"error",msg:r.ok?"Updated":"Failed"}}));
    if (r.ok) location.reload();
  }
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {invoices.map((i:any)=>(
          <li key={i.id} className="border rounded p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{i.plan?.name} — ₱{(i.amountCents/100).toFixed(2)} <span className="muted">({i.channel})</span></div>
              <div className="muted text-xs">Student: {i.student.email} · Status: {i.status}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>setStatus(i.id,"UNDER_REVIEW")}>Under review</button>
              <button className="btn" onClick={()=>setStatus(i.id,"PAID")}>Mark paid</button>
              <button className="btn" onClick={()=>setStatus(i.id,"REJECTED")}>Reject</button>
            </div>
          </li>
        ))}
        {invoices.length===0 && <li className="muted">No invoices yet.</li>}
      </ul>
    </div>
  );
}
`,
  "components/coach/CoachPaymentsSidebar.tsx": `
"use client";
import { useEffect, useState } from "react";
const items = [
  { id: "toggles",  label: "Payment Toggles" },
  { id: "banks",    label: "Bank Accounts" },
  { id: "ewallets", label: "E-Wallets" },
  { id: "plans",    label: "Plans" },
  { id: "invoices", label: "Invoices" },
];
function NavList({ active, onGo }: { active: string; onGo: (id:string)=>void }) {
  const linkBase = "btn w-full justify-start";
  const activeCx = "border-blue-600 text-blue-700 ring-1 ring-blue-600";
  return (
    <nav className="space-y-2">
      {items.map((it) => (
        <button key={it.id} className={\`\${linkBase} \${active === it.id ? activeCx : ""}\`} onClick={() => onGo(it.id)}>{it.label}</button>
      ))}
    </nav>
  );
}
export default function CoachPaymentsSidebar() {
  const [active, setActive] = useState("toggles");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }); },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    items.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  function go(id: string) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  return (<div className="hidden md:block fixed left-6 top-24 w-[240px] z-40"><div className="card"><NavList active={active} onGo={go} /></div></div>);
}
export function CoachPaymentsMobileBurger() {
  const [open, setOpen] = useState(false);
  function go(id: string){ const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); setOpen(false); }
  useEffect(()=>{ document.body.style.overflow = open ? "hidden" : ""; return ()=>{ document.body.style.overflow = ""; }; }, [open]);
  return (
    <div className="md:hidden">
      <button className="btn" onClick={()=>setOpen(true)} aria-label="Open menu"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>Menu</button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Payments Menu</div>
              <button className="btn" onClick={()=>setOpen(false)} aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg></button>
            </div>
            <nav className="space-y-2">{items.map((it)=>(<button key={it.id} className="btn w-full justify-start" onClick={()=>go(it.id)}>{it.label}</button>))}</nav>
          </div>
        </div>
      )}
    </div>
  );
}
`,
};

const STUDENT_PAY_COMPONENTS = {
  "components/student/CreateInvoiceButton.tsx": `
"use client";
import { useState } from "react";

export default function CreateInvoiceButton({ planId, enableBank, enableEwallet }: { planId: string; enableBank: boolean; enableEwallet: boolean }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState(enableBank ? "BANK" : "E_WALLET");
  async function create() {
    const r = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, channel }) });
    if (r.ok) { const j = await r.json(); window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Invoice created"}})); location.href = "/payments/" + j.invoice.id; }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Failed"}}));
  }
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>Select & Create Invoice</button>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-sm space-y-3">
            <div className="font-medium">Choose payment channel</div>
            <select className="input" value={channel} onChange={(e)=>setChannel(e.target.value)}>
              {enableBank && <option value="BANK">Bank transfer</option>}
              {enableEwallet && <option value="E_WALLET">e-Wallet</option>}
            </select>
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
`,
  "components/student/ProofUploadForm.tsx": `
"use client";
import { useState } from "react";

export default function ProofUploadForm({ id }: { id: string }) {
  const [file, setFile] = useState<File|null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Max 10MB"}})); return; }
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(\`/api/invoices/\${id}/upload\`, { method: "POST", body: fd });
    setBusy(false);
    if (r.ok) { window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"success",msg:"Proof uploaded"}})); location.reload(); }
    else window.dispatchEvent(new CustomEvent("toast",{detail:{kind:"error",msg:"Upload failed"}}));
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input className="input" type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button className="btn-primary" disabled={busy || !file}>{busy ? "Uploading..." : "Upload"}</button>
    </form>
  );
}
`,
};

const STUDENT_PAGES = {
  "app/(student)/payments/page.tsx": `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import CreateInvoiceButton from "@/components/student/CreateInvoiceButton";

export const metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true }});
  if (!me || me.role !== "STUDENT") return notFound();

  const mem = await prisma.membership.findFirst({ where: { studentId: me.id }, include: { deck: { include: { coach: true } } } });
  const coachId = mem?.deck?.coachId || null;

  let plans: any[] = [];
  let banks: any[] = [];
  let ewallets: any[] = [];
  let toggles: any = null;

  if (coachId) {
    toggles = await prisma.coachPaymentsConfig.findUnique({ where: { coachId } });
    plans = await prisma.paymentPlan.findMany({ where: { coachId, active: true }, orderBy: { createdAt: "desc" } });
    banks = await prisma.coachBankAccount.findMany({ where: { coachId }, orderBy: { createdAt: "desc" } });
    ewallets = await prisma.coachEwallet.findMany({ where: { coachId }, orderBy: { createdAt: "desc" } });
  }

  const invoices = await prisma.invoice.findMany({ where: { studentId: me.id }, include: { plan: true, coach: true, deck: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Payments</h1>

      <section className="card">
        <div className="font-medium mb-2">Available Plans</div>
        {coachId ? (
          <>
            {plans.length ? (
              <ul className="grid md:grid-cols-2 gap-3">
                {plans.map((p)=>(
                  <li key={p.id} className="border rounded p-3 space-y-2">
                    <div className="font-medium">{p.name} <span className="muted">({p.type})</span></div>
                    <div>₱{(p.amountCents/100).toFixed(2)}</div>
                    <CreateInvoiceButton planId={p.id} enableBank={!!toggles?.enableBank && banks.length>0} enableEwallet={!!toggles?.enableEwallet && ewallets.length>0} />
                  </li>
                ))}
              </ul>
            ) : <div className="muted">No plans published yet.</div>}
            <div className="text-sm muted mt-4 space-y-3">
              {toggles?.enableBank && banks.length>0 && (
                <div>
                  <div className="font-medium">Bank transfer</div>
                  <ul className="list-disc ml-4">
                    {banks.map(b=>(<li key={b.id}>{b.bankName}{b.bankBranch ? " — "+b.bankBranch : ""} · {b.accountName} · {b.accountNumber}</li>))}
                  </ul>
                </div>
              )}
              {toggles?.enableEwallet && ewallets.length>0 && (
                <div>
                  <div className="font-medium">e-Wallets</div>
                  <ul className="list-disc ml-4">
                    {ewallets.map(w=>(<li key={w.id}>{w.provider} · {w.accountName} · {w.accountNumber}{w.notes ? " — "+w.notes : ""}</li>))}
                  </ul>
                </div>
              )}
            </div>
          </>
        ) : <div className="muted">No coach found for your deck yet.</div>}
      </section>

      <section className="card">
        <div className="font-medium mb-2">My Invoices</div>
        <ul className="space-y-2">
          {invoices.map((i)=>(
            <li key={i.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{i.plan?.name} — ₱{(i.amountCents/100).toFixed(2)} <span className="muted">({i.channel})</span></div>
                <div className="muted text-xs">Status: {i.status} · {new Date(i.createdAt).toLocaleString()}</div>
              </div>
              <Link className="btn" href={"/payments/"+i.id}>Open</Link>
            </li>
          ))}
          {invoices.length===0 && <li className="muted">No invoices yet.</li>}
        </ul>
      </section>
    </div>
  );
}
`,
  "app/(student)/payments/[id]/page.tsx": `
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProofUploadForm from "@/components/student/ProofUploadForm";

export const metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return notFound();

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true }});
  if (!me || me.role !== "STUDENT") return notFound();

  const inv = await prisma.invoice.findFirst({ where: { id, studentId: me.id }, include: { plan: { include: { coach: true } }, deck: true, coach: true } });
  if (!inv) return notFound();

  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: inv.coachId }});
  const ewallets = await prisma.coachEwallet.findMany({ where: { coachId: inv.coachId }});
  const cfg = await prisma.coachPaymentsConfig.findUnique({ where: { coachId: inv.coachId } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoice</h1>
      <div className="card space-y-2">
        <div className="font-medium">{inv.plan.name} <span className="muted">({inv.plan.type})</span></div>
        <div>Amount due: <b>₱{(inv.amountCents/100).toFixed(2)}</b> — Channel: {inv.channel}</div>
        <div className="muted text-sm">Coach: {inv.coach.email} · Deck: {inv.deck?.name || "-"}</div>
        <div className="muted text-sm">Status: {inv.status}</div>
      </div>

      <div className="card space-y-2">
        <div className="font-medium">Payment Instructions</div>
        {inv.channel === "BANK" && cfg?.enableBank && banks.length>0 ? (
          <ul className="list-disc ml-4 text-sm">{banks.map(b=>(<li key={b.id}>{b.bankName}{b.bankBranch ? " — "+b.bankBranch : ""} · {b.accountName} · {b.accountNumber}</li>))}</ul>
        ) : inv.channel === "E_WALLET" && cfg?.enableEwallet && ewallets.length>0 ? (
          <ul className="list-disc ml-4 text-sm">{ewallets.map(w=>(<li key={w.id}>{w.provider} · {w.accountName} · {w.accountNumber}{w.notes ? " — "+w.notes : ""}</li>))}</ul>
        ) : <div className="muted text-sm">Channel instructions not available.</div>}
      </div>

      <div className="card space-y-3">
        <div className="font-medium">Upload proof of payment (max 10MB)</div>
        {inv.proofUrl ? (<div className="text-sm">Uploaded: <a className="underline" href={inv.proofUrl} target="_blank">View file</a></div>) : (<ProofUploadForm id={inv.id} />)}
      </div>
    </div>
  );
}
`,
};

const API_PAYMENTS = {
  "app/api/coach/payments/config/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const cfg = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: {}, create: { coachId: me.id } });
  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  const ewallets = await prisma.coachEwallet.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  return NextResponse.json({ config: cfg, banks, ewallets });
}
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  const data: any = { enableBank: !!j?.enableBank, enableEwallet: !!j?.enableEwallet };
  const updated = await prisma.coachPaymentsConfig.upsert({ where: { coachId: me.id }, update: data, create: { coachId: me.id, ...data } });
  return NextResponse.json({ config: updated });
}
`,
  "app/api/coach/payments/banks/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id: true, role: true }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const banks = await prisma.coachBankAccount.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  return NextResponse.json({ banks });
}
export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const count = await prisma.coachBankAccount.count({ where: { coachId: me.id }});
  if (count >= 5) return NextResponse.json({ error: "max_channels" }, { status: 400 });
  const j = await req.json().catch(()=>null);
  if (!j?.bankName || !j?.accountName || !j?.accountNumber) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const bank = await prisma.coachBankAccount.create({ data: { coachId: me.id, bankName: String(j.bankName), bankBranch: j.bankBranch ? String(j.bankBranch) : null, accountName: String(j.accountName), accountNumber: String(j.accountNumber) } });
  return NextResponse.json({ bank }, { status: 201 });
}
export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachBankAccount.findFirst({ where: { id: j.id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data: any = {};
  if (j.bankName != null) data.bankName = String(j.bankName);
  if (j.bankBranch != null) data.bankBranch = j.bankBranch ? String(j.bankBranch) : null;
  if (j.accountName != null) data.accountName = String(j.accountName);
  if (j.accountNumber != null) data.accountNumber = String(j.accountNumber);
  const bank = await prisma.coachBankAccount.update({ where: { id: j.id }, data });
  return NextResponse.json({ bank });
}
export async function DELETE(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachBankAccount.findFirst({ where: { id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.coachBankAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
`,
  "app/api/coach/payments/ewallets/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id: true, role: true }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const items = await prisma.coachEwallet.findMany({ where: { coachId: me.id }, orderBy: { createdAt: "desc" }});
  return NextResponse.json({ ewallets: items });
}
export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const count = await prisma.coachEwallet.count({ where: { coachId: me.id }});
  if (count >= 5) return NextResponse.json({ error: "max_channels" }, { status: 400 });
  const j = await req.json().catch(()=>null);
  if (!j?.provider || !j?.accountName || !j?.accountNumber) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const item = await prisma.coachEwallet.create({ data: { coachId: me.id, provider: String(j.provider), accountName: String(j.accountName), accountNumber: String(j.accountNumber), notes: j.notes ? String(j.notes) : null } });
  return NextResponse.json({ ewallet: item }, { status: 201 });
}
export async function PATCH(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachEwallet.findFirst({ where: { id: j.id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data: any = {};
  if (j.provider != null) data.provider = String(j.provider);
  if (j.accountName != null) data.accountName = String(j.accountName);
  if (j.accountNumber != null) data.accountNumber = String(j.accountNumber);
  if (j.notes != null) data.notes = j.notes ? String(j.notes) : null;
  const item = await prisma.coachEwallet.update({ where: { id: j.id }, data });
  return NextResponse.json({ ewallet: item });
}
export async function DELETE(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role !== "COACH" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.coachEwallet.findFirst({ where: { id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.coachEwallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
`,
  "app/api/coach/payments/plans/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id:true, role:true }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const plans = await prisma.paymentPlan.findMany({ where: { coachId: me.id }, orderBy: { createdAt:"desc" }});
  return NextResponse.json({ plans });
}
export async function POST(req: Request){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.name || !j?.amount || isNaN(Number(j.amount))) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const plan = await prisma.paymentPlan.create({ data: { coachId: me.id, name: String(j.name), description: j.description?String(j.description):null, type: j.type==="SUBSCRIPTION"?"SUBSCRIPTION":"ONE_TIME", amountCents: Math.round(Number(j.amount)*100) } });
  return NextResponse.json({ plan }, { status: 201 });
}
export async function PATCH(req: Request){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const j = await req.json().catch(()=>null);
  if (!j?.id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.paymentPlan.findFirst({ where: { id: j.id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const data:any = {};
  if (j.name!=null) data.name = String(j.name);
  if (j.description!=null) data.description = j.description?String(j.description):null;
  if (j.type!=null) data.type = j.type==="SUBSCRIPTION"?"SUBSCRIPTION":"ONE_TIME";
  if (j.amount!=null) data.amountCents = Math.round(Number(j.amount)*100);
  if (j.active!=null) data.active = !!j.active;
  const plan = await prisma.paymentPlan.update({ where: { id: j.id }, data });
  return NextResponse.json({ plan });
}
export async function DELETE(req: Request){
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const owned = await prisma.paymentPlan.findFirst({ where: { id, coachId: me.id }});
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.paymentPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
`,
  "app/api/invoices/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }, select: { id:true, role:true }});
  if (!me || me.role!=="STUDENT") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const j = await req.json().catch(()=>null);
  const plan = await prisma.paymentPlan.findUnique({ where: { id: String(j?.planId || "") }, include: { coach: true }});
  if (!plan || !plan.active) return NextResponse.json({ error: "plan_invalid" }, { status: 400 });

  // resolve deck (student's membership with this coach)
  const mem = await prisma.membership.findFirst({ where: { studentId: me.id, deck: { coachId: plan.coachId } }, include: { deck: true }});
  const invoice = await prisma.invoice.create({
    data: {
      planId: plan.id, coachId: plan.coachId, studentId: me.id, deckId: mem?.deckId || null,
      channel: j?.channel==="BANK" ? "BANK" : "E_WALLET",
      amountCents: plan.amountCents,
    }
  });
  return NextResponse.json({ invoice }, { status: 201 });
}
`,
  "app/api/invoices/[id]/upload/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || me.role!=="STUDENT") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const inv = await prisma.invoice.findFirst({ where: { id: params.id, studentId: me.id } });
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (file.size > 10*1024*1024) return NextResponse.json({ error: "too_large" }, { status: 400 });

  // In production: upload to S3/R2/etc. For now, store as data URL (demo).
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = "data:"+file.type+";base64,"+buf.toString("base64");
  const updated = await prisma.invoice.update({ where: { id: inv.id }, data: { proofUrl: dataUrl, proofUploadedAt: new Date(), status: "AWAITING_PROOF" } });

  return NextResponse.json({ invoice: updated });
}
`,
  "app/api/invoices/[id]/status/route.ts": `
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: s.user.email }});
  if (!me || (me.role!=="COACH" && me.role!=="SUPER_ADMIN")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const j = await req.json().catch(()=>null);
  const allowed = new Set(["PENDING","AWAITING_PROOF","UNDER_REVIEW","PAID","REJECTED"]);
  if (!j?.status || !allowed.has(String(j.status))) return NextResponse.json({ error: "bad_status" }, { status: 400 });

  const inv = await prisma.invoice.findFirst({ where: { id: params.id, coachId: me.id } });
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.invoice.update({ where: { id: inv.id }, data: { status: j.status } });
  return NextResponse.json({ invoice: updated });
}
`,
};

/* WRITE FILES */

w("package.json", PKG);
w("tsconfig.json", TSCONFIG);
w("postcss.config.cjs", POSTCSS);
w("tailwind.config.ts", TAILWIND);
w("styles/globals.css", GLOBALS);
w(".env.example", ENV_EXAMPLE);
w(".gitignore", GITIGNORE);

w("prisma/schema.prisma", PRISMA_SCHEMA);
w("prisma/seed.ts", SEED_TS);

w("lib/db.ts", LIB_DB);
w("lib/mail.ts", LIB_MAIL);
w("lib/auth.ts", LIB_AUTH);

w("components/UserMenu.tsx", USER_MENU);
w("components/Toast.tsx", TOAST);
w("components/TicketActions.tsx", TICKET_ACTIONS);
w("components/DocCreateForm.tsx", DOC_CREATE);

/* app structure */
w("app/layout.tsx", APP_LAYOUT);
w("app/loading.tsx", APP_LOADING);
w("app/page.tsx", HOME_PAGE);

/* auth pages */
w("app/(auth)/signin/page.tsx", SIGNIN);
w("app/(auth)/signup/page.tsx", SIGNUP);
w("app/(auth)/forgot/page.tsx", FORGOT);
w("app/(auth)/reset-password/page.tsx", RESET);

/* auth routes */
w("app/api/auth/[...nextauth]/route.ts", NEXTAUTH_ROUTE);
w("app/api/auth/register/route.ts", REGISTER_ROUTE);
w("app/api/auth/forgot/route.ts", FORGOT_ROUTE);
w("app/api/auth/reset/route.ts", RESET_ROUTE);

/* admin */
w("app/(admin)/admin/approvals/page.tsx", ADMIN_APPROVALS);
w("app/api/admin/users/[id]/status/route.ts", ADMIN_STATUS_ROUTE);

/* decks */
w("app/(dashboard)/decks/page.tsx", DECKS_PAGE);
w("app/(dashboard)/decks/[id]/page.tsx", DECK_DETAIL);
w("app/(dashboard)/decks/[id]/progress/new/page.tsx", PROGRESS_NEW);

/* decks api */
w("app/api/decks/route.ts", API_DECKS);
w("app/api/tickets/route.ts", API_TICKETS_CREATE);
w("app/api/tickets/[id]/status/route.ts", API_TICKETS_STATUS);
w("app/api/tickets/[id]/comments/route.ts", API_TICKETS_COMMENTS);
w("app/api/documents/route.ts", API_DOCS);
w("app/api/progress/route.ts", API_PROGRESS);

/* coach payments */
w("app/(coach)/coach/payments/page.tsx", COACH_PAY_PAGE);
Object.entries(COACH_PAY_COMPONENTS).forEach(([f,c])=>w(f,c));

/* student payments */
Object.entries(STUDENT_PAY_COMPONENTS).forEach(([f,c])=>w(f,c));
Object.entries(STUDENT_PAGES).forEach(([f,c])=>w(f,c));

/* payments api */
Object.entries(API_PAYMENTS).forEach(([f,c])=>w(f,c));

console.log(`
✅ Repo rebuilt.

Next steps:
1) Create .env.local (copy from .env.example and fill)
2) Install deps:   pnpm i   # or npm i
3) Migrate DB:     npx prisma migrate dev -n init
4) Seed users:     npm run seed
5) Start dev:      npm run dev

Seeded accounts:
- Super Admin: melenciojrl@gmail.com / Admin12345!
- Coach:       coach@example.com    / Coach12345!
- Student:     student@example.com  / Student12345!
`);
