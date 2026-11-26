// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// Static, pre-rendered HTML for the domain root (q3interiors.ie). Every page is a real file with a
// trailing slash (/our-work/fairview/index.html) so search engines find it; no client router.
export default defineConfig({
  site: 'https://q3interiors.ie',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', assets: '_assets' },
  prefetch: false,
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
})
