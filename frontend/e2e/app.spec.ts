import { test, expect } from '@playwright/test'

test.describe('Frontend PWA E2E Test Suite', () => {
  test('harus memuat halaman login RUNA', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1.title')).toContainText('RUNA')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('harus menampilkan status online', async ({ page }) => {
    await page.goto('/')
    const pwaBadge = page.locator('.pwa-badge')
    await expect(pwaBadge).toBeVisible()
    await expect(pwaBadge).toContainText(/Online|Offline/)
  })

  test('harus memiliki link web manifest PWA yang terpasang', async ({ page }) => {
    await page.goto('/')
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveAttribute('href', /manifest\.webmanifest/)
  })

  test('halaman modul tidak bisa dibuka tanpa login', async ({ page }) => {
    await page.goto('/stok')
    await expect(page.getByLabel('Username')).toBeVisible()
  })
})
