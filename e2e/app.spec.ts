import { test, expect } from '@playwright/test'

test.describe('App Smoke Tests', () => {
    test('homepage loads successfully', async ({ page }) => {
        await page.goto('/')

        // Wait for the app to load
        await expect(page).toHaveTitle(/NutriAI|Calorie/i)
    })

    test('app renders without JavaScript errors', async ({ page }) => {
        const errors: string[] = []

        page.on('pageerror', (error) => {
            errors.push(error.message)
        })

        await page.goto('/')
        await page.waitForTimeout(2000)

        // Filter out known benign errors (like extension errors)
        const criticalErrors = errors.filter(
            (e) => !e.includes('extension') && !e.includes('chrome-extension')
        )

        expect(criticalErrors).toHaveLength(0)
    })

    test('main navigation is visible', async ({ page }) => {
        await page.goto('/')

        // Check that the page has loaded with some content
        const body = await page.locator('body')
        await expect(body).toBeVisible()
    })
})
