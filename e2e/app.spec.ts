import { test, expect } from '@playwright/test'

/**
 * Minimal E2E smoke tests for CI.
 * These tests verify the server is running and serving static files.
 * They do NOT require backend services (Supabase) to be configured.
 */
test.describe('Server Smoke Tests', () => {
    test('server responds with HTML', async ({ page }) => {
        const response = await page.goto('/')

        // Verify server is running and responds
        expect(response).not.toBeNull()
        expect(response?.status()).toBe(200)

        // Verify it's serving HTML
        const contentType = response?.headers()['content-type']
        expect(contentType).toContain('text/html')
    })

    test('index.html contains expected structure', async ({ page }) => {
        await page.goto('/')

        // Check for basic HTML structure (static content)
        const html = await page.content()
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<div id="root">')
        expect(html).toContain('<script')
    })

    test('static assets are served', async ({ request }) => {
        // Test that the server can serve the base page
        const response = await request.get('/')
        expect(response.ok()).toBeTruthy()
    })
})
