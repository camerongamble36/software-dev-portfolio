import { defineConfig, devices } from "@playwright/test";

// Set E2E_BASE_URL to test a deployed site (e.g. a Vercel preview) instead of a local build.
const remote = process.env.E2E_BASE_URL;
const port = 3200;
const baseURL = remote ?? `http://localhost:${port}`;

// Vercel previews behind Deployment Protection need the automation bypass header.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: remote
    ? undefined
    : {
        command: `npm run build && npm run start -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        // The contact form logs instead of emailing during tests.
        env: { CONTACT_DELIVERY: "log" },
      },
});
