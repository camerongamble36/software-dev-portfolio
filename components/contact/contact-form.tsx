"use client";

import { zodResolver } from "@/lib/zod-resolver";
import { CheckCircle2, Send } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { sendContactMessage, type ContactResult } from "@/app/contact/actions";
import { useAudience } from "@/components/audience/audience-provider";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/content/site";
import { getAudience } from "@/lib/audiences";
import {
  CONTACT_LIMITS,
  CONTACT_TOPICS,
  CONTACT_TOPIC_LABELS,
  contactSchema,
  type ContactInput,
  type ContactOutput,
  type ContactTopic,
} from "@/lib/contact";
import { cn } from "@/lib/utils";

const MESSAGE_PLACEHOLDERS: Record<ContactTopic, string> = {
  role: "A little context helps me reply properly.",
  project: "A little context helps me reply properly.",
  feedback: "What worked, what didn't, what you'd change...",
  hello: "Hi, how are you? :)",
};

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 text-primary placeholder:text-secondary aria-invalid:border-brand";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-secondary"> {hint}</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-link" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const { audience } = useAudience();
  const uid = useId();
  const ids = {
    topic: `${uid}-topic`,
    name: `${uid}-name`,
    email: `${uid}-email`,
    message: `${uid}-message`,
  };
  const [result, setResult] = useState<ContactResult | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getFieldState,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput, unknown, ContactOutput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: getAudience(audience).contactTopic, name: "", email: "", message: "" },
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Follow the audience chosen on the slider until the visitor picks a topic themselves.
  useEffect(() => {
    if (!getFieldState("topic").isDirty) setValue("topic", getAudience(audience).contactTopic);
  }, [audience, getFieldState, setValue]);

  const topic = useWatch({ control, name: "topic" });
  const emailOptional = topic === "feedback";

  async function onSubmit(form: ContactOutput) {
    const response = await sendContactMessage({
      form,
      audience,
      botCheck: { website: honeypot.current?.value ?? "", startedAt: startedAt.current },
    });
    if (response.status === "invalid") {
      for (const [field, message] of Object.entries(response.fieldErrors)) {
        if (field in ids) setError(field as keyof ContactInput, { message });
      }
      return;
    }
    setResult(response);
  }

  if (result?.status === "sent") {
    return (
      <div
        role="status"
        data-testid="contact-sent"
        className="rounded-xl border border-line-subtle bg-surface p-6"
      >
        <CheckCircle2 aria-hidden className="size-6 text-link" />
        <h2 className="mt-3 text-xl font-semibold">Thanks, message sent.</h2>
        <p className="mt-2 text-secondary">
          I read everything that comes in. If you left an email, I&apos;ll reply within a few days.
        </p>
      </div>
    );
  }

  const describedBy = (field: keyof typeof ids) =>
    errors[field] ? `${ids[field]}-error` : undefined;

  return (
    <form onSubmit={(event) => handleSubmit(onSubmit)(event)} noValidate className="space-y-5">
      <Field id={ids.topic} label="What's this about?" error={errors.topic?.message}>
        <select
          id={ids.topic}
          className={cn(inputClass, "min-h-11")}
          aria-invalid={!!errors.topic}
          aria-describedby={describedBy("topic")}
          {...register("topic")}
        >
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {CONTACT_TOPIC_LABELS[topic]}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={ids.name} label="Name" hint="(optional)" error={errors.name?.message}>
          <input
            id={ids.name}
            type="text"
            autoComplete="name"
            maxLength={CONTACT_LIMITS.name}
            className={cn(inputClass, "min-h-11")}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
            {...register("name")}
          />
        </Field>
        <Field
          id={ids.email}
          label="Email"
          hint={emailOptional ? "(optional for feedback)" : undefined}
          error={errors.email?.message}
        >
          <input
            id={ids.email}
            type="email"
            autoComplete="email"
            maxLength={CONTACT_LIMITS.email}
            className={cn(inputClass, "min-h-11")}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            {...register("email")}
          />
        </Field>
      </div>

      <Field id={ids.message} label="Message" error={errors.message?.message}>
        <textarea
          id={ids.message}
          rows={6}
          maxLength={CONTACT_LIMITS.message}
          placeholder={MESSAGE_PLACEHOLDERS[topic] ?? MESSAGE_PLACEHOLDERS.role}
          className={cn(inputClass, "py-2")}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message")}
          {...register("message")}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {(result?.status === "failed" || result?.status === "not-configured") && (
        <p role="alert" className="rounded-lg border border-line bg-sunken p-3 text-sm">
          {result.status === "not-configured"
            ? "The contact form isn't switched on yet."
            : "Something went wrong sending that."}{" "}
          {site.linkedinUrl && (
            <>
              You can reach me on{" "}
              <a href={site.linkedinUrl} className="text-link underline underline-offset-4">
                LinkedIn
              </a>{" "}
              instead.
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(buttonVariants(), "w-full sm:w-auto")}
      >
        <Send aria-hidden /> {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
