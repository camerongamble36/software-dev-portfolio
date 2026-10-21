@AGENTS.md

# software-dev-portfolio

Cam's public developer portfolio. Next.js (App Router, Cache Components) + TypeScript + Tailwind v4,
hosted on Vercel. The repo is public and part of the pitch: keep it clean, and never commit secrets
or private details.

## Developer Knowledge Contract

Knowledge stack: https://raw.githubusercontent.com/camerongamble36/knowledge-stack/main/KNOWLEDGE_STACK.md

1. Technology under **Known & Comfortable**: use freely.
2. Under **Learning / Recently Added**: acknowledge it is newer and proceed with light guidance.
3. **Not listed**: STOP. Explain what it is, why, and tradeoffs vs. what Cam already knows. Ask
   before writing code that depends on it.
4. After approval, remind Cam to add it to KNOWLEDGE_STACK.md (title, description, URL, date).
   Never silently introduce a new library, pattern, or service.

Explicitly declined: **Cloudflare Turnstile**. Do not add it. No Vercel AI SDK, no PDF-generation
library, no Style Dictionary/culori.

## Conventions

- **Colours:** Canvas tokens live in `app/globals.css` as CSS variables, mapped to Tailwind names
  (`bg-canvas`, `bg-surface`, `bg-sunken`, `bg-brand`, `border-line`, `text-primary`,
  `text-secondary`, `text-link`, ...). Tailwind's default palette is removed. Never hardcode hex in
  components. `tests/unit/contrast.test.ts` enforces WCAG AA for text pairs in both themes.
- **Theme:** next-themes with `data-theme`; the `dark:` variant reads that attribute.
- **Audiences:** one entry each in `content/audiences.ts` (id, label, accent, contactTopic,
  headline, intro, featured), validated by `lib/audiences.ts` at build time (2–6 entries, unique
  kebab-case ids). Add or remove an entry; nothing else changes. Don't add per-audience `Record`
  maps elsewhere: put the field on the entry. Accents map to classes in
  `components/audience/audience-accents.ts` and tints in `app/globals.css` (`--hero-<accent>`).
- **Case studies:** one typed file per study in `content/case-studies/<slug>.ts`, registered in
  `content/case-studies/index.ts`, validated by `lib/case-studies/schema.ts` at build time. The PDF
  must exist at `public/case-studies/<slug>.pdf` (a unit test fails otherwise).
- **Placeholders** must be labelled (`placeholder: true` and "Placeholder" in the title). Do not
  invent real case studies; they're planned with Cam.
- **Chat (phase 4)** stays isolated in `components/chat/` and `app/api/chat/`; nothing else imports
  from them except the nav link (gated by `site.chatEnabled`).

## Commands

```bash
npm run dev          # local dev server
npm run lint         # ESLint
npm run typecheck    # next typegen + tsc
npm test             # Vitest unit tests
npm run e2e          # Playwright (builds + serves locally; or set E2E_BASE_URL)
npm run format       # Prettier (+ Tailwind class sorting)
```
