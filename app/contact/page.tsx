import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about a role or a project, or tell me what you think of this site.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Get in touch</h1>
      <p className="mt-3 text-lg text-secondary">
        Got a role, a project, or a question? Send me a message. Or just tell me what you think of
        this site; you can leave feedback without an email.
      </p>
      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
