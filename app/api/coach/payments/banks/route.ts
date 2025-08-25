// app/api/coach/payments/banks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateBody = z.object({
  bankName: z.string().min(1),
  accountName: z.string().min(1),
  accountNumber: z.string().min(1),
  branch: z.string().optional(), // <-- prisma field is `branch`
});

const UpdateBody = z.object({
  id: z.string().min(1),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  branch: z.string().optional(),
});

// GET (optional): list banks for the signed-in coach
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const banks = await prisma.coachBankAccount.findMany({
    where: { coachId: me.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ banks });
}

// CREATE bank
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const count = await prisma.coachBankAccount.count({ where: { coachId: me.id } });
  if (count >= 5) return NextResponse.json({ error: "limit" }, { status: 400 });

  // Use parse (not safeParse) so fields are strongly required
  const p = CreateBody.parse(await req.json());

  const bank = await prisma.coachBankAccount.create({
    data: {
      bankName: p.bankName,
      accountName: p.accountName,
      accountNumber: p.accountNumber,
      branch: p.branch ?? null, // <-- prisma field is `branch`
      coach: { connect: { id: me.id } }, // relation connect (no coachId in data)
    },
  });

  return NextResponse.json({ bank }, { status: 201 });
}

// UPDATE bank (by id in body)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const p = UpdateBody.parse(await req.json());

  // ensure bank belongs to this coach
  const bank = await prisma.coachBankAccount.findUnique({ where: { id: p.id } });
  if (!bank || bank.coachId !== me.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.coachBankAccount.update({
    where: { id: p.id },
    data: {
      bankName: p.bankName ?? bank.bankName,
      accountName: p.accountName ?? bank.accountName,
      accountNumber: p.accountNumber ?? bank.accountNumber,
      branch: typeof p.branch === "undefined" ? bank.branch : p.branch,
    },
  });

  return NextResponse.json({ bank: updated });
}
