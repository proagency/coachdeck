// app/api/invoices/[id]/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs"; // fs required

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest, ctx: any) {
  // Next 15: params must be awaited
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  // Save to /tmp (ephemeral). Swap to S3/R2 later.
  const uploadDir = "/tmp/coachdeck-uploads";
  await mkdir(uploadDir, { recursive: true });
  const ext = (file.type?.split("/")[1] || "bin").toLowerCase();
  const key = `${id}-${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, key);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buf);

  const updated = await prisma.invoice.update({
    where: { id },
    data: { proofKey: filepath, status: "SUBMITTED" },
    select: {
      id: true, status: true, coachId: true, studentId: true,
      amount: true, currency: true, title: true
    },
  });

  return NextResponse.json({ ok: true, invoice: updated });
}
