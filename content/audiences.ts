import type { Audience } from "@/lib/audiences";

export type AudienceContent = {
  headline: string;
  /** Two short lines. */
  intro: [string, string];
  /** Case-study slugs to feature first, in order. Unlisted ones follow. */
  featured: string[];
};

// Draft copy: Cam will edit. Keep it short.
export const audienceContent: Record<Audience, AudienceContent> = {
  recruiter: {
    headline: "Full-stack developer, web and mobile.",
    intro: [
      "TypeScript, React and Next.js, Node, and Flutter.",
      "Each case study has a 30-second version and a PDF to pass along.",
    ],
    featured: ["placeholder-alpha", "placeholder-beta"],
  },
  manager: {
    headline: "I own features from idea to production.",
    intro: [
      "Plan first, test as I go, ship in small steps.",
      "The case studies show the decisions and tradeoffs, not just the stack.",
    ],
    featured: ["placeholder-beta", "placeholder-alpha"],
  },
  peer: {
    headline: "Here's how the things I build actually work.",
    intro: [
      "Architecture, testing and the odd sharp edge.",
      "This site's source is public too, slider included.",
    ],
    featured: ["placeholder-alpha", "placeholder-beta"],
  },
  "friend-family": {
    headline: "So this is what I do all day.",
    intro: [
      "I make apps and websites people use on their phones and laptops.",
      "Start with the 30-second versions. No jargon required.",
    ],
    featured: ["placeholder-beta", "placeholder-alpha"],
  },
  partner: {
    headline: "Let's build something useful together.",
    intro: [
      "I turn rough ideas into working products, end to end.",
      "See what I've shipped and how I like to work.",
    ],
    featured: ["placeholder-alpha", "placeholder-beta"],
  },
};
