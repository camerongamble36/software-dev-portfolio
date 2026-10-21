import { afterEach, describe, expect, it, vi } from "vitest";
import { sendContactMessage } from "@/app/contact/actions";
import {
  CONTACT_TOPICS,
  MIN_FILL_MS,
  contactSchema,
  formatContactEmail,
  isLikelyBot,
} from "@/lib/contact";
import { deliverContactMessage } from "@/lib/contact-delivery";

const valid = {
  topic: "role" as const,
  name: "Ada",
  email: "ada@example.com",
  message: "Hello, I have a role you might like.",
};

describe("contactSchema", () => {
  it("accepts a complete message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("requires an email unless the topic is feedback", () => {
    expect(contactSchema.safeParse({ ...valid, email: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, topic: "feedback", email: "" }).success).toBe(true);
  });

  it.each([
    ["bad email", { email: "not-an-email" }],
    ["too-short message", { message: "hi" }],
    ["too-long message", { message: "x".repeat(3001) }],
    ["too-long name", { name: "x".repeat(101) }],
    ["unknown topic", { topic: "sales" }],
  ])("rejects %s", (_, override) => {
    expect(contactSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it("lists the topics in dropdown order", () => {
    expect(CONTACT_TOPICS).toEqual(["role", "project", "feedback", "hello"]);
  });
});

describe("isLikelyBot", () => {
  const now = 1_000_000;
  it("flags a filled honeypot or an instant submit", () => {
    expect(isLikelyBot({ website: "spam.example", startedAt: now - 60_000 }, now)).toBe(true);
    expect(isLikelyBot({ website: "", startedAt: now - 500 }, now)).toBe(true);
  });
  it("lets a person through", () => {
    expect(isLikelyBot({ website: "", startedAt: now - MIN_FILL_MS - 1 }, now)).toBe(false);
  });
});

describe("formatContactEmail", () => {
  it("builds a fixed subject and a plain-text body", () => {
    const { subject, text } = formatContactEmail(contactSchema.parse(valid), "recruiter");
    expect(subject).toBe("[Portfolio] A role or opportunity");
    expect(text).toContain("Email: ada@example.com");
    expect(text).toContain("Audience selected on the site: recruiter");
    expect(text).toContain(valid.message);
  });

  it("never puts visitor text in the subject", () => {
    const { subject } = formatContactEmail(
      contactSchema.parse({ ...valid, name: "Evil\r\nBcc: x@y.z" }),
      null,
    );
    expect(subject).not.toContain("Evil");
  });
});

describe("deliverContactMessage", () => {
  const message = { subject: "S", text: "T", replyTo: "ada@example.com" };

  it("reports not-configured without a key or destination", async () => {
    const fetchMock = vi.fn();
    expect(await deliverContactMessage(message, {}, fetchMock)).toBe("not-configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends plain text with reply-to through Resend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const env = { RESEND_API_KEY: "test-key", CONTACT_TO_EMAIL: "me@example.com" };
    expect(await deliverContactMessage(message, env, fetchMock)).toBe("sent");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ to: ["me@example.com"], text: "T", reply_to: "ada@example.com" });
    expect(body).not.toHaveProperty("html");
  });

  it("reports failure on an error response or network error", async () => {
    const env = { RESEND_API_KEY: "k", CONTACT_TO_EMAIL: "me@example.com" };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const bad = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
    expect(await deliverContactMessage(message, env, bad)).toBe("failed");
    const down = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await deliverContactMessage(message, env, down)).toBe("failed");
  });
});

describe("sendContactMessage", () => {
  afterEach(() => vi.unstubAllEnvs());
  const person = { website: "", startedAt: Date.now() - 10_000 };

  it("returns field errors for invalid input", async () => {
    const result = await sendContactMessage({
      form: { ...valid, email: "nope" },
      botCheck: person,
      audience: "recruiter",
    });
    expect(result).toEqual({
      status: "invalid",
      fieldErrors: { email: "Enter a valid email address" },
    });
  });

  it("pretends to succeed for bots without delivering", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const result = await sendContactMessage({
      form: valid,
      botCheck: { website: "http://spam", startedAt: Date.now() - 10_000 },
      audience: "recruiter",
    });
    expect(result).toEqual({ status: "sent" });
  });

  it("reports not-configured when email delivery isn't set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_DELIVERY", "");
    const result = await sendContactMessage({ form: valid, botCheck: person, audience: "peer" });
    expect(result).toEqual({ status: "not-configured" });
  });

  it("treats malformed payloads as bots", async () => {
    expect(await sendContactMessage("garbage")).toEqual({ status: "sent" });
  });
});
