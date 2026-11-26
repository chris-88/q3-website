// Full-page screenshots of every page at 390 and 1280 CSS px from a running preview.
// Usage: npm run build && npm run preview, then: node scripts/screenshots.mjs <out-dir> [base-url]
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const out = process.argv[2]
const base = process.argv[3] ?? 'http://127.0.0.1:4321'
if (!out) throw new Error('usage: node scripts/screenshots.mjs <out-dir> [base-url]')
fs.mkdirSync(out, { recursive: true })

const slugs = [
  'donabate',
  'fairview',
  'fitzwilliam-office',
  'castleknock',
  'fitzwilliam-bathroom',
  'adelaide',
]
const pages = [
  ['home', '/'],
  ['our-work', '/our-work/'],
  ...slugs.map((s) => [`project-${s}`, `/our-work/${s}/`]),
  ['privacy', '/privacy/'],
  ['404', '/no-such-page/'],
]
const browser = await chromium.launch()
for (const width of [390, 1280]) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : 800 } })
  const page = await ctx.newPage()
  for (const [name, p] of pages) {
    await page.goto(base + p, { waitUntil: 'networkidle' })
    // Bring lazy images in before the full-page capture.
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager'
      const visible = [...document.images].filter((i) => i.offsetParent)
      await Promise.all(visible.map((i) => i.decode().catch(() => {})))
    })
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(out, `${name}-${width}.png`), fullPage: true })
  }
  await ctx.close()
}
await browser.close()
console.log(`wrote ${pages.length * 2} screenshots to ${out}`)
