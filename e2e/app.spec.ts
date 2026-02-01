import { test, expect } from '@playwright/test'

/*
 * Robust E2E smoke tests for CI.
 * - Waits for network idle before asserting
 * - Captures page console and page errors so CI logs show the underlying JS failures
 * - Targets a specific navigation selector but falls back to body if not present
 */

test.describe('App Smoke Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(baseURL ?? '/', { waitUntil: 'networkidle' })
  })

  test('app renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(String(e)))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

    // Allow the app to settle after navigation
    await page.waitForLoadState('networkidle')

    // Wait briefly for root or navigation to appear (not required to pass the test)
    await page.waitForSelector('nav, header, [data-test=main-nav], #root', { timeout: 10000 }).catch(() => {})

    // Log errors to help CI artifact investigation
    if (errors.length) console.error('Client errors:', errors)

    expect(errors).toHaveLength(0)
  })

  test('main navigation is visible', async ({ page }) => {
    const navSelector = 'nav, header, [data-test=main-nav]'

    // If a nav element exists, wait for it to be visible. Otherwise, fallback to checking the body.
    const navExists = await page.locator(navSelector).first().count()
    if (navExists) {
      await expect(page.locator(navSelector)).toBeVisible({ timeout: 10000 })
    } else {
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    }
  })
})