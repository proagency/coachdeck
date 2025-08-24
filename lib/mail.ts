import nodemailer from "nodemailer";
type MailArgs = { to: string; subject: string; text?: string; html?: string; fromOverride?: string };

export async function sendMail({ to, subject, text, html, fromOverride }: MailArgs) {
  const url = process.env.EMAIL_SERVER;
  const from = fromOverride || process.env.EMAIL_FROM || "CoachDeck <no-reply@example.com>";
  if (!url) { console.warn("[mail] EMAIL_SERVER not set; printing to console"); console.log({ to, subject, text, html }); return { ok: true, dev: true }; }
  const transporter = nodemailer.createTransport(url);
  try {
    if (process.env.NODE_ENV !== "production") { await transporter.verify().catch(()=>{}); }
    const info = await transporter.sendMail({ to, from, subject, text: text || "", html: html || (text ? `<pre>${text}</pre>` : "") });
    console.log("[mail] sent", info.messageId);
    return { ok: true };
  } catch (e:any) { console.error("[mail] error", e?.message || e); return { ok: false, error: String(e?.message || e) }; }
}
