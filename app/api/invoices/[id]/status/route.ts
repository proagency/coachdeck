// app/api/invoices/[id]/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs"; // we need fs

// Max: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 async params in Next 15
) {
  const { id } = await context.params; // 👈 must await
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  // Save to /tmp (ephemeral). Swap to S3/GCS/etc. later as needed.
  const uploadDir = "/tmp/coachdeck-uploads";
  await mkdir(uploadDir, { recursive: true });
  const ext = (file.type?.split("/")[1] || "bin").toLowerCase();
  const key = `${id}-${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, key);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buf);

  // Mark invoice as "SUBMITTED" and store proof key
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      proofKey: filepath, // or store just `key` if you later move to object storage
      status: "SUBMITTED",
    },
    select: { id: true, status: true, coachId: true, studentId: true, amount: true, currency: true, title: true },
  });

  return NextResponse.json({ ok: true, invoice: updated });
}
