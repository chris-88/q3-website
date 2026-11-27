# CLAUDE.md

Guidance for the agent working on this repo. Read it fully before changing anything.

## What this is

The public website of Q3 Interiors at `https://q3interiors.ie`: a Dublin renovation and fit-out business: the person who visits runs the job and brings in the trades it needs. It shows the work and sends homeowners to the booking site, `https://book.q3interiors.ie` (repo `chris-88/q3-interiors`), for a free 20-minute phone call or a free 60-minute site visit. It replaces the old site at the same domain.

Phase 1 (2026-11-28): home, "Our work" gallery, six project pages, privacy, 404, sitemap, robots, favicons, Open Graph. Static pre-rendered HTML; the only JavaScript is the small campaign-tag script below.

| Concern     | Choice                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Build       | Astro 7 (`output: 'static'`, `trailingSlash: 'always'`, `build.format: 'directory'`), TypeScript strictest                             |
| Styling     | Tailwind CSS v4 via `@tailwindcss/vite`; tokens in `src/styles/global.css`                                                             |
| Fonts       | Roboto 400/500/700 self-hosted with `@fontsource/roboto` (latin, `font-display: swap`)                                                 |
| Tests       | Vitest (`src/**/*.test.ts`); Playwright + axe against `astro preview` of the production build                                          |
| Lint/format | `astro check` (types), oxlint, Prettier with the Astro and Tailwind plugins                                                            |
| Hosting     | GitHub Pages via Actions on push to `main`; `public/CNAME` = `q3interiors.ie`; the apex is a proxied Cloudflare record to GitHub Pages |
| Node        | `.nvmrc` = 24, npm                                                                                                                     |

Why Astro: real HTML files at real URLs (search engines must find each project), zero JavaScript by default, components and TypeScript at build time. No client router, no hydration.

## Definition of done

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test` pass; after `npm run build`, `npm run test:e2e` passes.
- Every word follows the tone of voice (below). No new claim the business has not made.
- Mobile first: 24px side gutters, 48px targets, visible focus, reduced motion respected, no horizontal scroll at 320px.
- No request to any other host at runtime (the e2e test fails on one). No cookies, no analytics, no storage.
- Conventional commits, one concern each. Push to `main` deploys (rolling deploy is authorised).

## Booking link contract

Every link into booking is built by `bookingLink()` in `src/lib/booking.ts`; the base URL is the one constant `BOOKING_BASE_URL`. The booking side documents the same contract in `chris-88/q3-interiors` `docs/website-links.md`.

```text
https://book.q3interiors.ie/?appointment=<call|visit>[&inspiration=<slug>][&project_type=<label>]&utm_source=q3website&utm_medium=referral&utm_content=<page>
```

- Parameters in the real query string, never after a `#`. Same tab.
- Home and gallery: `appointment` only (plus the tags). Project pages: `inspiration=<slug>` always, and `project_type` when the project's `suggestedProjectType` is set (Kitchen for fairview, Bathroom for castleknock and fitzwilliam-bathroom, `Workplace fit-out` for fitzwilliam-office). Spaces are encoded `%20`.
- Campaign tags: every booking link carries the website's own tags by default, `utm_source=q3website&utm_medium=referral&utm_content=<page>` where page is `home`, `our-work` or the project slug, so website visits can be told apart in the booking report. If the visitor arrived with any of `utm_source, utm_medium, utm_campaign, utm_content, utm_term` on the page URL, the inline script (`src/lib/campaign.ts`, loaded from `Base.astro`) removes the defaults from booking links and puts the visitor's tags there unchanged, and adds them to internal links so they survive page to page (a tag already on an internal link wins). Without JavaScript the links still work with the defaults.
- Never put anything else in a link: no click ids, names, contact details or free text.

## Adding or changing a project

1. Put the photos in `public/assets/projects/` as `<slug>-small.webp` (about 480px wide) and `<slug>-wide.webp` (the larger file; never upscaled).
2. Add a record to `src/data/projects.json` (slug, title, location, audience `Homes` or `Workplaces`, `suggestedProjectType` or null, alt, description, both image paths with their true width and height). The order there is the gallery order and the previous/next order.
3. `npm run test` checks the JSON against the files' real dimensions; the page, sitemap entry and gallery card are generated.
4. Tell the booking side: its `src/lib/website.ts` lists the known slugs; an unknown `inspiration` is ignored there until added.

Replacing a photo with a better original: overwrite the file, update its `width`/`height` in the JSON, run the tests. Layouts never stretch an image past its own width.

## Phase 1 exclusions, and why

Not built and not mentioned anywhere on the site: the bathroom planner, any prices or price ranges, example progress updates, and anything for trades or contractors (no nav item, button, page or wording). Each needs approval from Q3 of the prices, capacity and process behind it before it is public. The e2e "phase 1 scope" test fails if such wording appears. The design screens' "Homeowners" / "Contractors" items were left out for the same reason.

## Copy and tone of voice

The tone-of-voice card (kept outside the repo) is binding. In short: "we" throughout, "you" for the homeowner; plain, direct, specific; Irish English, sentence case, no exclamation marks; headlines eight words or fewer; no adjectives any builder could claim (quality, professional, premium, bespoke, stunning, dream, transform, hassle-free, trusted...). An **estimate** is a price range; a **quote** is one price for an agreed scope (see Words we fix); the two appointments are a **call** and a **site visit**. No guarantees, no "fixed price", no "on time". Claims allowed: only the "Facts from Dad" section of the tone-of-voice card (one contact from first visit to finish, the trades brought in as the job needs, public liability insurance, the free call and site visit, estimate then quote then a 10% deposit to book the date, changes agreed before they are done, the six projects and how long each took). Do not invent other years, team size, reviews, awards or addresses; the service area comes from the business details.

## Words we fix

Use these terms exactly, in every page, test and note:

- **Estimate**: a price range (VAT included). It usually follows a site visit; it can follow a call when the job is simple enough to price without seeing it. Approved line: "Most jobs need a site visit before we can price them." Never say a price always needs a visit, and never suggest every call ends in one.
- **Quote**: one price for an agreed scope, with what is included and what is not. It is the only thing a customer accepts. The step is "Get a quote"; "written" is a describing word ("we send a written quote"), not part of the name.
- Never "full quote", "formal quote", "quotation" or "estimated range". Customers are not taught "indicative" or "refined".
- "Rough guide" is withdrawn and must not appear.
- **One person**: the person who visits runs the job and is the one contact. Never promise "one team"; never say "subcontractors" in customer copy ("we bring in the trades your job needs").
- "We carry public liability insurance", never "fully insured".
- The one contact is named: Chris Quinn (home page, "Who you deal with"). Q3 has traded since 2015 (Chris, 2026-11-27); it is stated once, in that block.

The e2e "phase 1 scope" test fails if a banned term appears.

## Contact details

Read at build time from the booking backend's public function `public_business_details()` (`src/lib/business.ts`, one call per build) with `Q3_API_URL` and `Q3_API_ANON_KEY` (repo variables in CI; `.env.example`). Only non-null fields show: phone and email in the footer, the service area line, the legal name, the privacy contact on `/privacy/`. The postal address is not shown. If the call fails the site builds without a contact line. Nothing personal is hard-coded. A change in the business details shows after the next deploy (push, or re-run the workflow).

## Brand

Same tokens and look as the booking site (`chris-88/q3-interiors` `src/index.css`) so there is no seam: white page, ink `#171717`, muted `#555555`, black actions (hover `#2B2B2B`), soft `#F5F5F5`, rule `#D4D4D4`, black footer panel with the white wordmark; 4px radius; 3px black focus ring (white on black). The wordmark SVGs and favicons in `public/` are copied unchanged from the booking site. `npm run brand:images` regenerates `public/og/q3-og.png`. The full wordmark is the home link (144px on phones, 160px from 768px). "Q3 Interiors" in text; "Q THREE" only in the artwork.

No-JavaScript patterns: the hero photo switcher and the gallery filter are visually hidden radios inside labels, driven by `:has()` rules in `global.css`.

## Commands

```bash
npm run dev           # local dev server
npm run build         # static site into dist/
npm run preview       # serve dist/ on :4321
npm run typecheck     # astro check
npm run lint          # oxlint
npm run format        # prettier --write
npm run test          # vitest
npm run test:e2e      # playwright against the preview (build first)
npm run brand:images  # regenerate the Open Graph card
node scripts/screenshots.mjs <dir>  # every page at 390 and 1280 from a running preview
```

The site is built for the domain root, so the github.io project URL shows it unstyled; check the local preview or the live domain.

## Hosting and Cloudflare

`q3interiors.ie` (apex) is a proxied Cloudflare record to GitHub Pages, the same as `book.` and `staff.`; the Pages custom domain is set. HTTPS is Cloudflare's, so GitHub's enforce-HTTPS is not used. The privacy page names both GitHub Pages and Cloudflare; keep it true if the hosting changes. Cloudflare's zone-wide Email Obfuscation would rewrite `mailto:` links and inject a script, so `Base.astro` wraps the body in `<!--email_off-->` markers; the e2e test fails if the built HTML loses them. A change in Cloudflare can change what visitors receive: after one, check the live HTML (`curl -s https://q3interiors.ie/ | grep cdn-cgi` should print nothing).
