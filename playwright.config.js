import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4456',
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python -m http.server 4456 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4456',
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
