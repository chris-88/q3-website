import projects from '../src/data/projects.json' with { type: 'json' }

export const slugs = projects.map((p) => p.slug)

export const PAGES = [
  '/',
  '/our-work/',
  ...slugs.map((s) => `/our-work/${s}/`),
  '/privacy/',
] as const

export const BOOKING = 'https://book.q3interiors.ie/'

/** The website's own tags, on every booking link when the visitor brought none. */
export const site = (page: string) => `utm_source=q3website&utm_medium=referral&utm_content=${page}`

/** The exact booking links each project page must carry (the contract in CLAUDE.md). */
export const PROJECT_LINKS: Record<string, string> = {
  donabate: 'inspiration=donabate',
  fairview: 'inspiration=fairview&project_type=Kitchen',
  'fitzwilliam-office': 'inspiration=fitzwilliam-office&project_type=Workplace%20fit-out',
  castleknock: 'inspiration=castleknock&project_type=Bathroom',
  'fitzwilliam-bathroom': 'inspiration=fitzwilliam-bathroom&project_type=Bathroom',
  adelaide: 'inspiration=adelaide',
}

export const bookingHrefs = async (page: import('@playwright/test').Page) =>
  page.$$eval('a[href^="https://book.q3interiors.ie"]', (as) =>
    as.map((a) => a.getAttribute('href') ?? ''),
  )
