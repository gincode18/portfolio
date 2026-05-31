"use server";

import "server-only";
import { headers } from "next/headers";
import { z } from "zod";
import nodemailer from "nodemailer";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { profile } from "@/content/profile";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(1, "Message is required").max(2000),
});

export type ContactState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<"name" | "email" | "message", string>> };

const RECIPIENT = profile.email;

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: ContactState extends { fieldErrors?: infer F } ? F : never =
      {} as never;
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "email" | "message";
      (fieldErrors as Record<string, string>)[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  // Rate limit by IP — 5 messages per day.
  const hdrs = await headers();
  const xff = hdrs.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim() || "unknown";
  const rl = checkRateLimit(`contact:${ip}`, {
    capacity: 5,
    refillPerSec: 5 / 86400,
  });
  if (!rl.allowed) {
    return {
      status: "error",
      message: `Too many messages today. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.`,
    };
  }

  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  // 1. Persist to SQLite (audit trail — independent of email delivery).
  const db = getDb();
  await db.insert(contactMessages).values({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    ipHash,
  });

  // 2. Send notification email.
  try {
    await sendMail(parsed.data, ip);
  } catch (err) {
    // The message is already saved; surface the error but tell the user it
    // landed in the admin queue regardless.
    console.error("[contact] email failed:", err);
    return {
      status: "error",
      message:
        "Message saved, but email notification failed. Vishal will still see it.",
    };
  }

  return { status: "ok" };
}

async function sendMail(
  input: { name: string; email: string; message: string },
  ip: string
) {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const portStr = process.env.EMAIL_SERVER_PORT ?? "587";
  const port = Number(portStr);

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP env not configured (EMAIL_SERVER_HOST / USER / PASSWORD)."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = `Portfolio: ${input.name}`;
  const body = [
    `New message from the Vishal OS contact form.`,
    ``,
    `From:    ${input.name} <${input.email}>`,
    `IP:      ${ip}`,
    `Sent:    ${new Date().toISOString()}`,
    ``,
    `Message:`,
    `--------`,
    input.message,
  ].join("\n");

  const html = `
    <p>New message from the Vishal OS contact form.</p>
    <ul>
      <li><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</li>
      <li><strong>IP:</strong> ${escapeHtml(ip)}</li>
      <li><strong>Sent:</strong> ${new Date().toISOString()}</li>
    </ul>
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;">${escapeHtml(input.message)}</pre>
  `;

  await transporter.sendMail({
    from: `"Portfolio" <${user}>`,
    to: RECIPIENT,
    replyTo: `"${input.name}" <${input.email}>`,
    subject,
    text: body,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
