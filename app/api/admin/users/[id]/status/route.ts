import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Zod schema for payload
const Body = z.object({
  status: z.enum(["PENDING", "ACTIVE", "DISABLED"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ← async params
) {
  const { id } = await params; // ← must await in Next 15
  const session = await getServerSession(authOptions);
  const me = session?.user;

  // Only Super Admins can change user status
  if (!me || (me as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parse = Body.safeParse(await req.json().catch(() => ({})));
  if (!parse.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { status } = parse.data;

  // Optionally disallow changing your own status
  if ((me as any).id === id) {
    return NextResponse.json({ error: "cannot_modify_self" }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, email: true, status: true, role: true },
  });

  return NextResponse.json({ ok: true, user });
}
