// app/api/coach-payments/ewallets/route.ts
import { NextRequest, NextResponse } from "next/server";
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

  const payload = Body.parse(await req.json());
  const { provider, handle } = payload;

  const wallet = await prisma.coachEwallet.create({
    data: {
      provider,
      handle,
      coach: { connect: { id: me.id } },
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}
