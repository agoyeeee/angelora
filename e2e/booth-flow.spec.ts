import { expect, test } from '@playwright/test'

/**
 * End-to-end photobooth journey. The Chromium project runs with
 * `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream`
 * (see playwright.config.ts), so the camera stream is synthetic and approved
 * without a prompt.
 */
test.describe('photobooth session', () => {
  test('landing → booth → capture → result → download PNG', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/')
    await page.getByRole('link', { name: 'Start Photobooth' }).first().click()
    await expect(page).toHaveURL(/\/booth$/)
    await expect(
      page.getByRole('heading', { name: 'Set up your shot' }),
    ).toBeVisible()

    // Three photos keeps the capture loop short (countdown is 3s each).
    await page.getByRole('button', { name: '3 photos' }).click()

    // Consent is explicit: the camera only starts after this click.
    await page.getByRole('button', { name: 'Turn on camera' }).click()
    await expect(page.getByText('Camera ready', { exact: true })).toBeVisible({
      timeout: 30_000,
    })

    await page.getByRole('button', { name: 'Start session' }).click()

    // The booth auto-advances to the result page once the strip is complete.
    await page.waitForURL(/\/result$/, { timeout: 60_000 })
    await expect(
      page.getByRole('heading', { name: 'Little moments, printed.' }),
    ).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download PNG' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(
      /^flashframe-\d{4}-\d{2}-\d{2}\.png$/,
    )
  })

  test('a denied camera grant shows the retry state', async ({ page }) => {
    // Simulate the user blocking the camera: the fake-UI launch flag
    // auto-approves, so override getUserMedia to reject with the name the app
    // maps to its "denied" status.
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(
          Object.assign(new Error('Permission denied'), {
            name: 'NotAllowedError',
          }),
        )
    })

    await page.goto('/booth')
    await page.getByRole('button', { name: 'Turn on camera' }).click()

    await expect(page.getByText('Camera permission is blocked')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })
})
