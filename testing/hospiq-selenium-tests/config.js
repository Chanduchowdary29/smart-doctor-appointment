// ─── HospiQ Vercel — Selenium Live Test Configuration ───────────────────────
module.exports = {
  baseUrl: 'https://hospiq-livid.vercel.app',
  timeout: 10000,
  screenshotDir: './screenshots',
  reportDir: '.',
  chromeOptions: {
    // Windowed mode — watch tests live in Chrome
    args: [
      '--window-size=1280,800',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  }
};
