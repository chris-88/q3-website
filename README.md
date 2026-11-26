# Q3 Interiors website

The public website of Q3 Interiors, served at `https://q3interiors.ie`. Static pages built with Astro and Tailwind CSS; bookings happen on `https://book.q3interiors.ie`.

## Run it

```bash
nvm use        # Node 24
npm ci
npm run dev    # http://localhost:4321
```

To show the contact line locally, set `Q3_API_URL` and `Q3_API_ANON_KEY` (see `.env.example`); without them the site builds without it.

## Check it

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test
npm run build && npx playwright install chromium && npm run test:e2e
```

## Deploy

Push to `main`. GitHub Actions runs the checks, builds and publishes to GitHub Pages. The domain `q3interiors.ie` is a proxied Cloudflare record to GitHub Pages (HTTPS is Cloudflare's).

See `CLAUDE.md` for the booking link contract, how to add a project and what is deliberately left out.
