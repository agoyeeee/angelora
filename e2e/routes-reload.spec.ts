import { expect, test } from '@playwright/test'

/**
 * The app is served by `vite preview` (SPA fallback). Every main route must
 * survive a hard reload and return the real SPA rather than a hosting 404.
 */
const routes = [
  { path: '/', heading: 'Little moments. Iconic strips.' },
  { path: '/booth', heading: 'Set up your shot' },
  { path: '/result', heading: 'Nothing to show yet' },
  { path: '/privacy', heading: 'Your photos stay on your device.' },
] as const

for (const { path, heading } of routes) {
  test(`reload on ${path} returns the app`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.locator('#root')).not.toBeEmpty()
  })
}
