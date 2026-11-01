import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
    launchOptions: {
      args: ["--autoplay-policy=no-user-gesture-required"],
    },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-landscape",
      use: {
        ...devices["Pixel 5 landscape"],
        permissions: [],
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
