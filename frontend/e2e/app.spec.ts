import { test, expect } from '@playwright/test'

test.describe('Frontend PWA E2E Test Suite', () => {
  test('harus memuat halaman utama dan menampilkan judul GEN APHYAH', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1.title')).toContainText('GEN APHYAH')
  })

  test('harus menampilkan badge PWA dan status online', async ({ page }) => {
    await page.goto('/')
    const pwaBadge = page.locator('.pwa-badge')
    await expect(pwaBadge).toBeVisible()
    await expect(pwaBadge).toContainText(/PWA/)
  })

  test('harus memiliki link web manifest PWA yang terpasang', async ({ page }) => {
    await page.goto('/')
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveAttribute('href', /manifest\.webmanifest/)
  })
})

