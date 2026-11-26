// Generates the link-preview card public/og/q3-og.png (1200x630) from the supplied wordmark SVG
// and the self-hosted Roboto, with Playwright's Chromium. Run: npm run brand:images
// The favicons, apple-touch-icon and wordmark SVGs are copied unchanged from the booking site
// (chris-88/q3-interiors public/), so both sites share one set.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const full = fs.readFileSync(path.join(root, 'public/brand/q3-full-black.svg'), 'utf8')
const font = (w) =>
  fs
    .readFileSync(
      path.join(root, `node_modules/@fontsource/roboto/files/roboto-latin-${w}-normal.woff2`),
    )
    .toString('base64')

const html = `<!doctype html><html><head><style>
@font-face { font-family: Roboto; font-weight: 400; src: url(data:font/woff2;base64,${font(400)}) format('woff2'); }
@font-face { font-family: Roboto; font-weight: 500; src: url(data:font/woff2;base64,${font(500)}) format('woff2'); }
html, body { margin: 0; background: #fff; }
.card { width: 1200px; height: 630px; box-sizing: border-box; padding: 96px; display: flex;
  flex-direction: column; justify-content: center; gap: 56px; font-family: Roboto, sans-serif; color: #171717; }
.logo svg { display: block; width: 480px; height: auto; }
p { margin: 0; font-size: 64px; line-height: 1.08; font-weight: 500; letter-spacing: -0.01em; }
p span { display: block; font-weight: 400; color: #555555; font-size: 36px; line-height: 1.3; margin-top: 24px; letter-spacing: 0; }
</style></head><body><div class="card"><div class="logo">${full}</div>
<p>Construction. Without the complications.<span>Book a free phone call or site visit.</span></p></div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: path.join(root, 'public/og/q3-og.png') })
await browser.close()
console.log('wrote public/og/q3-og.png')
