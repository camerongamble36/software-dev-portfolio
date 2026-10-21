"use server";

import { z } from "zod";
import { parseAudience } from "@/lib/audiences";
import { botCheckSchema, contactSchema, formatContactEmail, isLikelyBot } from "@/lib/contact";
import { deliverContactMessage } from "@/lib/contact-delivery";

export type ContactResult =
  | { status: "sent" }
  | { status: "invalid"; fieldErrors: Partial<Record<string, string>> }
  | { status: "not-configured" }
  | { status: "failed" };

// Server Actions are public endpoints: treat every field as untrusted and re-validate.
export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const raw = z
    .object({ form: z.unknown(), botCheck: z.unknown(), audience: z.unknown() })
    .safeParse(input);
  const bot = botCheckSchema.safeParse(raw.success ? raw.data.botCheck : undefined);
  // Bots get the same "sent" response as people, so there's nothing to probe.
  if (!raw.success || !bot.success || isLikelyBot(bot.data, Date.now())) {
    return { status: "sent" };
  }

  const parsed = contactSchema.safeParse(raw.data.form);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "invalid", fieldErrors };
  }

  const email = formatContactEmail(parsed.data, parseAudience(raw.data.audience));
  const result = await deliverContactMessage({
    ...email,
    replyTo: parsed.data.email || undefined,
  });
  return { status: result };
}
