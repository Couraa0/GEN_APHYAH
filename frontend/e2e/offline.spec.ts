import { test, expect } from '@playwright/test'

// Backend dipalsukan di level jaringan, jadi tes ini hanya butuh dev server frontend.
const point = { id: '11111111-1111-4111-8111-111111111111', name: 'Titik 1', active: true }
const category = { id: '22222222-2222-4222-8222-222222222222', name: 'Plastik', active: true }
const user = { id: 'u1', name: 'Petugas Tes', username: 'petugas', role: 'PETUGAS', buyerId: null }

test('pengumpulan saat offline tersimpan di perangkat lalu tersinkron tepat satu kali', async ({ page }) => {
  let offline = false
  const posts: { key: string | undefined; body: unknown }[] = []

  await page.route('**/api/**', async (route) => {
    if (offline) return route.abort('internetdisconnected')
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api/, '')
    if (path === '/auth/login') return route.fulfill({ json: { accessToken: 'token-tes', user } })
    if (path === '/collections' && request.method() === 'POST') {
      posts.push({ key: request.headers()['idempotency-key'], body: request.postDataJSON() })
      return route.fulfill({ status: 201, json: { id: 'c1' } })
    }
    if (path === '/collection-points') return route.fulfill({ json: [point] })
    if (path === '/categories') return route.fulfill({ json: [category] })
    return route.fulfill({ json: [] })
  })

  await page.goto('/pengumpulan')
  await page.getByLabel('Username').fill('petugas')
  await page.getByLabel('Password').fill('password-tes')
  await page.getByRole('button', { name: 'Masuk' }).click()

  // Penanda menu aktif mengikuti halaman yang dibuka (Pengumpulan = menu kedua).
  await expect(page.locator('.rail-menu')).toHaveAttribute('style', /--aktif:\s*1/)

  await page.getByText('Titik 1', { exact: true }).click()
  await page.getByText('Plastik', { exact: true }).click()

  // Koneksi putus: transaksi tetap bisa disimpan, belum ada yang terkirim.
  offline = true
  await page.getByLabel('Berat (kg)').fill('3.5')
  await page.getByRole('button', { name: 'Simpan' }).click()
  const pending = page.getByRole('heading', { name: /Belum tersinkron/ })
  await expect(pending).toHaveText('Belum tersinkron (1)')
  expect(posts).toHaveLength(0)

  // Masih ada setelah aplikasi dimuat ulang (IndexedDB), dan data master tampil dari cache.
  await page.reload()
  await expect(pending).toHaveText('Belum tersinkron (1)')
  await expect(page.getByRole('cell', { name: 'Titik 1' })).toBeVisible()
  await expect(page.getByText(/Offline — menampilkan data terakhir/)).toBeVisible()

  // Koneksi kembali: terkirim sekali, membawa Idempotency-Key, antrean kosong.
  offline = false
  await page.getByRole('button', { name: 'Sinkronkan sekarang' }).click()
  await expect(pending).toHaveCount(0)
  expect(posts).toHaveLength(1)
  expect(posts[0].key).toMatch(/^[0-9a-f-]{36}$/)
  expect(posts[0].body).toMatchObject({
    collectionPointId: point.id,
    wasteCategoryId: category.id,
    weightKg: 3.5,
  })
})
