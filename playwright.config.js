import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "list",
  outputDir: "./coverage/playwright",
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 1024 } } },
  ],
  webServer: {
    command: process.env.HANGMAN_TEST_BUILD ? "npm run preview" : "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
