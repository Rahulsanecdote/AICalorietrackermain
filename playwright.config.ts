import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        // helpful artifacts for debugging CI flakes
        trace: 'on-first-retry',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        // Build then preview the production build
        command: 'pnpm build && pnpm preview --port 5173',
        url: 'http://localhost:5173',
        // Ensure Playwright starts the server on CI so tests run against the preview build
        reuseExistingServer: process.env.CI ? false : true,
        // Increase timeout for CI build step
        timeout: 240_000,
    },
})
