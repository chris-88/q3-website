import { existsSync, readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { BOOKING, PAGES, PROJECT_LINKS, bookingHrefs, site, slugs } from './pages'

test.describe('every page', () => {
  for (const path of PAGES) {
    test(`${path} returns, has one h1, a title and a canonical URL`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page).toHaveTitle(/Q3 Interiors/)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(canonical).toBe(`https://q3interiors.ie${path}`)
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy()
      expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(
        /^https:\/\/q3interiors\.ie\//,
      )
    })
  }

  test('an unknown address gets the 404 page', async ({ page }) => {
    const res = await page.goto('/no-such-page/')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("We can't find that page.")
  })

  test('sitemap lists every page and robots points at it', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(PAGES.map((p) => `https://q3interiors.ie${p}`))
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Sitemap: https://q3interiors.ie/sitemap.xml')
    // The preview server does not serve extensionless files; check the build output directly.
    expect(readFileSync('dist/CNAME', 'utf8').trim()).toBe('q3interiors.ie')
    expect(existsSync('dist/.nojekyll')).toBe(true)
  })
})

test.describe('phase 1 scope', () => {
  // Contractor material, prices and the planner are not on the public site yet.
  const banned =
    /contractor|subcontract|tradesperson|partner|planner|day rate|€|\bEUR\b|\d+\s?k\b|fixed price|guarantee|on time|construction confidence|full quote|quotation|estimated range|rough guide/i

  for (const path of [...PAGES, '/no-such-page/']) {
    test(`${path} has no contractor, price or planner content`, async ({ page }) => {
      await page.goto(path)
      const text = await page.locator('body').innerText()
      expect(text).not.toMatch(banned)
      const html = await page.content()
      expect(html).not.toMatch(/contractor|planner|homeowners/i)
    })
  }
})

test.describe('booking links', () => {
  test('home and gallery link to a plain call or visit, tagged as from the website', async ({
    page,
  }) => {
    for (const [path, name] of [
      ['/', 'home'],
      ['/our-work/', 'our-work'],
    ] as const) {
      await page.goto(path)
      const hrefs = [...new Set(await bookingHrefs(page))].toSorted()
      expect(hrefs).toEqual([
        `${BOOKING}?appointment=call&${site(name)}`,
        `${BOOKING}?appointment=visit&${site(name)}`,
      ])
    }
  })

  for (const slug of slugs) {
    test(`${slug} links carry its inspiration and suggestion exactly`, async ({ page }) => {
      await page.goto(`/our-work/${slug}/`)
      const hrefs = [...new Set(await bookingHrefs(page))].toSorted()
      const extra = PROJECT_LINKS[slug]
      expect(hrefs).toEqual([
        `${BOOKING}?appointment=call&${extra}&${site(slug)}`,
        `${BOOKING}?appointment=visit&${extra}&${site(slug)}`,
      ])
    })
  }

  test('privacy and 404 send the header button to the home page choices', async ({ page }) => {
    for (const path of ['/privacy/', '/no-such-page/']) {
      await page.goto(path)
      await expect(
        page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Book' }),
      ).toHaveAttribute('href', '/#book')
    }
  })

  test('project pages label the kind of project and the visit plainly', async ({ page }) => {
    await page.goto('/our-work/fitzwilliam-office/')
    await expect(page.locator('main .eyebrow')).toHaveText('Workplace project')
    await page.goto('/our-work/fairview/')
    await expect(page.locator('main .eyebrow')).toHaveText('Home project')
    await expect(page.locator('#book')).toContainText(
      'Tell us about it on a call, or we come out and look at the space.',
    )
    await expect(page.locator('#book')).toContainText(
      'Both are free. You can change or cancel the time online.',
    )
  })

  test('the privacy page links to the booking privacy notice', async ({ page }) => {
    await page.goto('/privacy/')
    await expect(
      page.getByRole('link', { name: "Read the booking site's privacy notice" }),
    ).toHaveAttribute('href', 'https://book.q3interiors.ie/#/privacy')
  })
})

test.describe('campaign tags', () => {
  test("a visitor's utm tags replace the website's own on booking links and carry onto internal links", async ({
    page,
  }) => {
    await page.goto(
      '/our-work/fairview/?utm_source=instagram&utm_medium=paid&utm_campaign=kitchens&fbclid=abc&email=x%40y.ie',
    )
    const tags = 'utm_source=instagram&utm_medium=paid&utm_campaign=kitchens'
    const hrefs = [...new Set(await bookingHrefs(page))].toSorted()
    expect(hrefs).toEqual([
      `${BOOKING}?appointment=call&inspiration=fairview&project_type=Kitchen&${tags}`,
      `${BOOKING}?appointment=visit&inspiration=fairview&project_type=Kitchen&${tags}`,
    ])
    await expect(page.getByRole('link', { name: 'Our work' }).first()).toHaveAttribute(
      'href',
      `/our-work/?${tags}`,
    )
    await expect(page.locator('a[rel="next"]')).toHaveAttribute(
      'href',
      `/our-work/fitzwilliam-office/?${tags}`,
    )
    const all = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''))
    for (const href of all) expect(href).not.toMatch(/fbclid|email=|q3website/)
    // Mail and phone links are untouched.
    for (const href of all.filter((h) => /^(mailto|tel):/.test(h)))
      expect(href).not.toContain('utm_')

    // Following an internal link keeps the visitor's tags for the next page's booking links.
    await page.locator('a[rel="next"]').click()
    await expect(page).toHaveURL(/fitzwilliam-office\/\?utm_source=instagram/)
    expect([...new Set(await bookingHrefs(page))].toSorted()).toEqual([
      `${BOOKING}?appointment=call&inspiration=fitzwilliam-office&project_type=Workplace%20fit-out&${tags}`,
      `${BOOKING}?appointment=visit&inspiration=fitzwilliam-office&project_type=Workplace%20fit-out&${tags}`,
    ])
  })

  test('a single visitor tag is carried alone, unchanged', async ({ page }) => {
    await page.goto('/?utm_content=reel%202')
    expect([...new Set(await bookingHrefs(page))].toSorted()).toEqual([
      `${BOOKING}?appointment=call&utm_content=reel%202`,
      `${BOOKING}?appointment=visit&utm_content=reel%202`,
    ])
  })

  test("without utm tags the links keep the website's own tags", async ({ page }) => {
    await page.goto('/?gclid=zzz')
    const hrefs = [...new Set(await bookingHrefs(page))].toSorted()
    expect(hrefs).toEqual([
      `${BOOKING}?appointment=call&${site('home')}`,
      `${BOOKING}?appointment=visit&${site('home')}`,
    ])
    const internal = await page.$$eval('a[href^="/"]', (as) =>
      as.map((a) => a.getAttribute('href') ?? ''),
    )
    for (const href of internal) expect(href).not.toContain('utm_')
  })
})

test.describe('layout and access', () => {
  for (const width of [320, 390, 1280]) {
    test(`no horizontal scroll at ${width}px on any page`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      for (const path of [...PAGES, '/no-such-page/']) {
        await page.goto(path)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, path).toBeLessThanOrEqual(0)
      }
    })
  }

  test('on a phone both booking choices come before the first photograph', async ({ page }) => {
    await page.goto('/')
    const choices = await page.locator('#book').boundingBox()
    const photo = await page.locator('[data-slide] img').first().boundingBox()
    expect(choices && photo && choices.y + choices.height <= photo.y).toBe(true)
    await expect(page.locator('#book').getByRole('link')).toHaveCount(2)
    await expect(page.locator('#book')).toContainText('Phone call · 20 minutes')
    await expect(page.locator('#book')).toContainText('Site visit · 60 minutes')
    await expect(page.locator('#book')).toContainText(
      'Both are free. You can change or cancel the time online.',
    )
    await expect(page.locator('#book')).toContainText(
      'We ring you at a time you pick and talk through your plans.',
    )
    await expect(page.locator('#book')).toContainText(
      'We come out, look at the space and measure up for an estimate.',
    )
  })

  test('interactive targets are at least 48px high in the main column', async ({ page }) => {
    for (const path of ['/', '/our-work/', '/our-work/fairview/']) {
      await page.goto(path)
      const small = await page.$$eval(
        'header a, #book a, [data-chip], [data-thumb], a.btn, nav[aria-label="More projects"] a',
        (els) =>
          els
            .filter((e) => (e as HTMLElement).offsetParent)
            .map((e) => [e.textContent?.trim(), e.getBoundingClientRect().height] as const)
            .filter(([, h]) => h < 47.5),
      )
      expect(small, path).toEqual([])
    }
  })

  for (const path of [...PAGES, '/no-such-page/']) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([])
    })
  }
})

test.describe('privacy', () => {
  test('no request leaves this site and no cookie is set, at phone and desktop widths', async ({
    page,
    context,
  }) => {
    const offsite: string[] = []
    page.on('request', (r) => {
      const u = new URL(r.url())
      if (u.protocol !== 'data:' && u.hostname !== '127.0.0.1') offsite.push(r.url())
    })
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const path of [...PAGES, '/no-such-page/']) {
        await page.goto(path, { waitUntil: 'networkidle' })
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForLoadState('networkidle')
      }
    }
    expect(offsite).toEqual([])
    expect(await context.cookies()).toEqual([])
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the gallery shows all six and the chips still filter', async ({ page }) => {
    await page.goto('/our-work/')
    const cards = page.locator('li[data-audience]')
    await expect(cards).toHaveCount(6)
    for (const card of await cards.all()) await expect(card).toBeVisible()
    await page.locator('[data-chip]', { hasText: 'Workplaces' }).click()
    await expect(page.locator('li[data-audience]:visible')).toHaveCount(1)
    await page.locator('[data-chip]', { hasText: 'Homes' }).click()
    await expect(page.locator('li[data-audience]:visible')).toHaveCount(5)
    await page.locator('[data-chip]', { hasText: 'All projects' }).click()
    await expect(page.locator('li[data-audience]:visible')).toHaveCount(6)
  })

  test('the hero thumbnails switch the photo', async ({ page }) => {
    await page.goto('/')
    const slides = page.locator('[data-slide]')
    await expect(slides.nth(0)).toBeVisible()
    await expect(slides.nth(1)).toBeHidden()
    await page.locator('[data-thumb]').nth(1).click()
    await expect(slides.nth(1)).toBeVisible()
    await expect(slides.nth(0)).toBeHidden()
    await expect(slides.nth(1)).toContainText('Kitchen fit-out')
  })

  test('booking links work as plain links', async ({ page }) => {
    await page.goto('/our-work/castleknock/')
    expect(await bookingHrefs(page)).toContain(
      `${BOOKING}?appointment=visit&inspiration=castleknock&project_type=Bathroom&${site('castleknock')}`,
    )
  })
})
