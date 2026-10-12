import { expect, test } from '@playwright/test'

test.describe('result without a session', () => {
  test('direct open of /result shows the empty state with a link to the booth', async ({
    page,
  }) => {
    await page.goto('/result')

    await expect(
      page.getByRole('heading', { name: 'Nothing to show yet' }),
    ).toBeVisible()
    await expect(page.getByText('No photos in this session')).toBeVisible()

    const backToBooth = page.getByRole('link', { name: 'Go to the booth' })
    await expect(backToBooth).toHaveAttribute('href', '/booth')

    await backToBooth.click()
    await expect(page).toHaveURL(/\/booth$/)
    await expect(
      page.getByRole('heading', { name: 'Set up your shot' }),
    ).toBeVisible()
  })
})
