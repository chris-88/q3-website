import type { APIRoute } from 'astro'
import { projectPath, projects } from '../lib/projects'

/** Every public page, for search engines. The 404 page is left out. */
export const sitePaths = (): string[] => [
  '/',
  '/our-work/',
  ...projects.map(projectPath),
  '/privacy/',
]

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://q3interiors.ie')
  const urls = sitePaths()
    .map((p) => `  <url><loc>${new URL(p, base).toString()}</loc></url>`)
    .join('\n')
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
