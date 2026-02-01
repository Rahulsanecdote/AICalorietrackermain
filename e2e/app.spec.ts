import { test, expect } from '@playwright/test'

test.describe('App Smoke Tests', () => {
    test('homepage loads successfully', async ({ page }) => {
        await page.goto('/')

        // Wait for the app to load - check for any content
        await page.waitForLoadState('domcontentloaded')

        // Verify page loaded with some content
        const html = await page.content()
        expect(html.length).toBeGreaterThan(100)
    })

    test('app renders content', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Check that the root element has content
        const root = page.locator('#root')
        await expect(root).toBeAttached()

        // Wait for some content to appear
        const content = await root.innerHTML()
        expect(content.length).toBeGreaterThan(0)
    })

    test('basic page structure exists', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')

        // Check that the page has basic structure
        const body = page.locator('body')
        await expect(body).toBeAttached()

        // Check root container exists
        const root = page.locator('#root')
        await expect(root).toBeAttached()
    })
})
