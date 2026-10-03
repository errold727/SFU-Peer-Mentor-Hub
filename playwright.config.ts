import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173/SFU-Peer-Mentor-Hub/',
    headless: true,
    channel: process.env.CI ? 'chromium' : 'msedge',
    viewport: { width: 1440, height: 1100 },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173',
        url: 'http://127.0.0.1:4173/SFU-Peer-Mentor-Hub/',
        reuseExistingServer: !process.env.CI,
      },
  reporter: 'list',
});
