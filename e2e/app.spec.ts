import { test, expect } from '@playwright/test'

/**
 * Robust E2E smoke tests for CI.
 * Uses production preview build for deterministic testing.
 */
test.describe('App Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Log errors for debugging CI failures
        page.on('pageerror', (error) => {
            console.log('PAGE ERROR:', error.message)
        })
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.log('CONSOLE ERROR:', msg.text())
            }
        })
    })

    test('homepage loads and returns HTML', async ({ page }) => {
        const response = await page.goto('/')

        // Verify we got a response
        expect(response).not.toBeNull()
        expect(response?.status()).toBeLessThan(500)

        // Wait for page to stabilize
        await page.waitForLoadState('networkidle')

        // Verify page has HTML content
        const html = await page.content()
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<div id="root">')
    })

    test('app renders content', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Check that the root element exists and has content
        const root = page.locator('#root')
        await expect(root).toBeAttached({ timeout: 10000 })

        // Wait for some content to render
        const content = await root.innerHTML()
        expect(content.length).toBeGreaterThan(0)
    })

    test('main UI is visible', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Look for common UI elements - adjust selector based on your app
        const uiElement = page.locator('nav, header, main, [data-testid], #root > div')
        await expect(uiElement.first()).toBeVisible({ timeout: 10000 })
    })
})
