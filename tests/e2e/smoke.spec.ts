import { expect, test } from '@playwright/test'

test('completes coping onboarding and opens the dedicated section', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Získej přehled nad svým hraním' })).toBeVisible()
  await page.getByRole('button', { name: 'Začít' }).click()

  await expect(
    page.getByRole('heading', { name: 'Co uděláš, když budeš chtít hrát?' }),
  ).toBeVisible()
  await expect(page.getByText('Vybrané strategie: 2')).toBeVisible()
  await page.getByLabel('Vlastní strategie (nepovinné)').fill('Odložím telefon do jiné místnosti')
  await page.getByLabel('Co ti pomůže začít? (nepovinné)').fill('Nastavím si časovač na 10 minut')
  await page.getByRole('button', { name: 'Dokončit nastavení' }).click()

  await expect(page.getByRole('heading', { name: 'Ahoj, dnes je den 6' })).toBeVisible()
  await page.getByRole('button', { name: 'Coping strategie' }).first().click()
  await expect(page.getByRole('heading', { name: 'Coping strategie', exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Odložím telefon do jiné místnosti' }),
  ).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Ahoj, dnes je den 6' })).toBeVisible()
})

test('does not allow an empty coping plan', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Začít' }).click()
  await page.getByRole('button', { name: 'Půjdu na 15 minut ven' }).click()
  await page.getByRole('button', { name: 'Zavolám někomu blízkému' }).click()
  await page.getByRole('button', { name: 'Dokončit nastavení' }).click()
  await expect(page.getByText('Vyber alespoň jednu strategii.')).toBeVisible()
})

test('serves a PWA manifest', async ({ page }) => {
  const response = await page.goto('/manifest.webmanifest')
  expect(response?.status()).toBe(200)
})
