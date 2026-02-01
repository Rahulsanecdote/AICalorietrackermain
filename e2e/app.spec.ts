import { test, expect } from '@playwright/test'

/**
 * Basic E2E smoke tests for CI.
 * These tests are designed to be resilient in CI environments
 * where backend services (like Supabase) may not be configured.
 */
test.describe('App Smoke Tests', () => {
    test('homepage loads and returns HTML', async ({ page }) => {
        const response = await page.goto('/')

        // Verify we got a response
        expect(response).not.toBeNull()
        expect(response?.status()).toBeLessThan(500)

        // Verify page has HTML content
        const html = await page.content()
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<div id="root">')
    })

    test('dev server is running and serving assets', async ({ page }) => {
        const response = await page.goto('/')

        // Check that the dev server responded
        expect(response?.ok() || response?.status() === 304).toBeTruthy()

        // Check for basic page structure
        await page.waitForLoadState('domcontentloaded')
        const root = page.locator('#root')
        await expect(root).toBeAttached({ timeout: 5000 })
    })

    test('page title is set', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')

        // Check that page has a title (might be default or app title)
        const title = await page.title()
        expect(title.length).toBeGreaterThan(0)
    })
})
