// app/api/coach/payments/ewallets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateBody = z.object({
  provider: z.string().min(1),
  handle: z.string().min(1), // phone/username/etc
});

// List wallets for the signed-in coach
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const wallets = await prisma.coachEwallet.findMany({
    where: { coachId: me.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ wallets });
}

// Create wallet (limit 5)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email } });
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const count = await prisma.coachEwallet.count({ where: { coachId: me.id } });
  if (count >= 5) return NextResponse.json({ error: "limit" }, { status: 400 });

  const p = CreateBody.parse(await req.json());

  const wallet = await prisma.coachEwallet.create({
    data: {
      provider: p.provider,
      handle: p.handle,
      coach: { connect: { id: me.id } }, // relation connect (no coachId in data)
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}
