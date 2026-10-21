/**
 * Server-side delivery for contact messages.
 * Configured entirely by env vars so no address or key lives in the public repo:
 *   RESEND_API_KEY     Resend API key
 *   CONTACT_TO_EMAIL   where messages go
 *   CONTACT_FROM_EMAIL sender (defaults to Resend's onboarding address until a domain is verified)
 *   CONTACT_DELIVERY=log  logs the subject instead of sending. For local dev and the e2e
 *                         suite only. Never set it on Vercel, or messages are dropped.
 */

export type DeliveryResult = "sent" | "not-configured" | "failed";

type Message = { subject: string; text: string; replyTo?: string };

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Portfolio <onboarding@resend.dev>";

export async function deliverContactMessage(
  message: Message,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<DeliveryResult> {
  if (env.CONTACT_DELIVERY === "log") {
    console.info("[contact] dry run:", message.subject);
    return "sent";
  }

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return "not-configured";

  try {
    const response = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // Log the status only; never the message contents.
      console.error("[contact] Resend responded", response.status);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("[contact] Resend request failed");
    return "failed";
  }
}
