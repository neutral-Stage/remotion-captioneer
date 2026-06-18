import { defineConfig, devices } from "@playwright/test";

const docsPort = 3460;
const previewPort = 3456;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "docs",
      testMatch: /docs-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${docsPort}` },
    },
    {
      name: "preview",
      testMatch: /preview-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${previewPort}` },
    },
  ],
  webServer: [
    {
      command: `node scripts/serve-static.mjs docs ${docsPort}`,
      port: docsPort,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `node dist/cli.js preview -p ${previewPort}`,
      port: previewPort,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
