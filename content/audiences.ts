import type { AudienceInput } from "@/lib/audiences";

/**
 * Who the site can be tuned for, in slider order (left to right). The first is the default.
 *
 * To add an audience, add an entry; to remove one, delete it. Nothing else needs to change.
 * - id: kebab-case, stable (it's saved in visitors' browsers; removed ids fall back to the default)
 * - accent: one of violet | blue | teal | pink | gold (sets the dot and the hero tint)
 * - contactTopic: the contact form's default topic for this audience
 * - featured: case-study slugs to show first, in order
 * Between 2 and 6 audiences (more won't fit the slider labels on a phone).
 * Validated at build time by lib/audiences.ts. Draft copy: Cam will edit.
 */
export const audienceEntries = [
  {
    id: "recruiter",
    label: "Recruiter",
    accent: "violet",
    contactTopic: "role",
    headline: "Full-stack developer, web and mobile.",
    intro: [
      "TypeScript, React and Next.js, Node, and Flutter.",
      "Each case study has a 30-second version and a PDF to pass along.",
    ],
    featured: ["placeholder-alpha", "placeholder-beta"],
  },
  {
    id: "manager",
    label: "Hiring manager",
    accent: "blue",
    contactTopic: "role",
    headline: "I own features from idea to production.",
    intro: [
      "Plan first, test as I go, ship in small steps.",
      "The case studies show the decisions and tradeoffs, not just the stack.",
    ],
    featured: ["placeholder-beta", "placeholder-alpha"],
  },
  {
    id: "peer",
    label: "Fellow developer",
    accent: "teal",
    contactTopic: "feedback",
    headline: "Here's how the things I build actually work.",
    intro: [
      "Architecture, testing and the odd sharp edge.",
      "This site's source is public too, slider included.",
    ],
    featured: ["placeholder-alpha", "placeholder-beta"],
  },
  {
    id: "friend-family",
    label: "Friend or family",
    accent: "pink",
    contactTopic: "hello",
    headline: "So this is what I do all day.",
    intro: [
      "I make apps and websites people use on their phones and laptops.",
      "Start with the 30-second versions. No jargon required.",
    ],
    featured: ["placeholder-beta", "placeholder-alpha"],
  },
  {
    id: "partner",
    label: "Business partner",
    accent: "gold",
    contactTopic: "project",
    headline: "Let's build something useful together.",
    intro: [
      "I turn rough ideas into working products, end to end.",
      "See what I've shipped and how I like to work.",
    ],
    featured: ["placeholder-alpha", "placeholder-beta"],
  },
] satisfies AudienceInput[];
