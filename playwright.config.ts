import { defineConfig, devices } from '@playwright/test'

// Runs against `astro preview` of the production build in dist/ (run `npm run build` first).
// E2E_PORT moves the server if the default is taken.
const PORT = Number(process.env.E2E_PORT ?? 4321)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
})
