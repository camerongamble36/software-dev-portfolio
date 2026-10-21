import { z } from "zod";
import type { Audience } from "@/lib/audiences";

/** Contact topics, in dropdown order. Labels are also used as the email subject. */
export const CONTACT_TOPICS = ["role", "project", "feedback", "hello"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  role: "A role or opportunity",
  project: "A project or collaboration",
  feedback: "Feedback on this site",
  hello: "Just saying hi",
};

export const CONTACT_LIMITS = { name: 100, email: 254, message: 3000 } as const;

/**
 * Shared by the form (client-side validation) and the server action (the real check).
 * Email is optional only for site feedback, so people can leave it anonymously.
 */
export const contactSchema = z
  .object({
    topic: z.enum(CONTACT_TOPICS, { message: "Choose what this is about" }),
    name: z.string().trim().max(CONTACT_LIMITS.name, "That name is too long"),
    email: z
      .string()
      .trim()
      .max(CONTACT_LIMITS.email)
      .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
    message: z
      .string()
      .trim()
      .min(10, "Add a little more detail (10+ characters)")
      .max(CONTACT_LIMITS.message, `Keep it under ${CONTACT_LIMITS.message} characters`),
  })
  .refine((data) => data.topic === "feedback" || data.email !== "", {
    message: "Add your email so I can reply",
    path: ["email"],
  });

export type ContactInput = z.input<typeof contactSchema>;
export type ContactOutput = z.output<typeof contactSchema>;

/** Anti-spam fields sent alongside the form. Never shown to people. */
export const botCheckSchema = z.object({
  /** Honeypot: a hidden field real visitors leave empty. */
  website: z.string().max(200).default(""),
  /** When the form was first rendered (ms since epoch). */
  startedAt: z.number().int().positive(),
});

/** Real people take more than a few seconds to write a message. */
export const MIN_FILL_MS = 3000;

export function isLikelyBot(check: z.infer<typeof botCheckSchema>, now: number): boolean {
  return check.website.trim() !== "" || now - check.startedAt < MIN_FILL_MS;
}

/** The plain-text email body. Plain text only, so nothing a visitor types is rendered as HTML. */
export function formatContactEmail(
  data: z.output<typeof contactSchema>,
  audience: Audience | null,
): { subject: string; text: string } {
  return {
    subject: `[Portfolio] ${CONTACT_TOPIC_LABELS[data.topic]}`,
    text: [
      `Topic: ${CONTACT_TOPIC_LABELS[data.topic]}`,
      `Name: ${data.name || "(not given)"}`,
      `Email: ${data.email || "(not given)"}`,
      `Audience selected on the site: ${audience ?? "(unknown)"}`,
      "",
      data.message,
    ].join("\n"),
  };
}
