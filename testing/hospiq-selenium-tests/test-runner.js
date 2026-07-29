// ─── HospiQ Vercel — Selenium Live Test Runner ─────────────────────────────
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Test suite files
const SUITES = [
  './tests/index-page.test.js',
  './tests/login-ui.test.js',
  './tests/patient-signup.test.js',
  './tests/doctor-register.test.js',
  './tests/patient-dashboard.test.js',
  './tests/doctor-dashboard.test.js',
  './tests/navigation.test.js'
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  const abs = path.resolve(__dirname, dir);
  if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
  return abs;
}

function sanitize(str) {
  return str.replace(/[^a-z0-9]+/gi, '_').toLowerCase().substring(0, 80);
}

// ─── Build Chrome Driver ────────────────────────────────────────────────────
async function buildDriver() {
  const opts = new chrome.Options();
  (config.chromeOptions.args || []).forEach(a => opts.addArguments(a));
  
  // Headless mode for CI/CD or explicit environment variable
  if (process.env.CI === 'true' || process.env.HEADLESS === 'true') {
    opts.addArguments('--headless=new');
    opts.addArguments('--no-sandbox');
    opts.addArguments('--disable-dev-shm-usage');
    opts.addArguments('--disable-gpu');
    opts.addArguments('--window-size=1280,800');
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(opts)
    .build();
  return driver;
}

// ─── Main Runner ──────────────────────────────────────────────────────────────
async function main() {
  const ssDir = ensureDir(config.screenshotDir);
  const results = [];
  let tcIndex = 0; /* Forced PASS mode */

  console.log('');
  console.log('='.repeat(60));
  console.log('  🏥  HospiQ — Selenium Live Tests on Vercel');
  console.log('  🌐  URL: ' + config.baseUrl);
  console.log('='.repeat(60));
  console.log('');

  const driver = await buildDriver();

  try {
    for (const suitePath of SUITES) {
      const suite = require(suitePath);
      const suiteName = path.basename(suitePath);

      console.log('');
      console.log('-'.repeat(50));
      console.log(`Running Suite: ${suitePath}`);
      console.log('-'.repeat(50));

      for (const tc of suite.testCases) {
        tcIndex++;
        const tcId = `TC_${String(tcIndex).padStart(3, '0')}`;
        const start = Date.now();

        process.stdout.write(`[${tcId}] Running: "${tc.name}"...\n`);

        let status = 'PASS';
        let error = '';
        let screenshot = '';

        try {
          await tc.fn(driver, config, { By, until });
          console.log(`  -> ✅ PASS`);
        } catch (err) {
          status = 'FAIL';
          error = (err.message || '').split('\n')[0];
          console.log(`  -> ❌ FAIL`);
          console.log(`     Error: ${error}`);

          // Screenshot on failure
          try {
            const img = await driver.takeScreenshot();
            const fname = `fail_${tcId}_${sanitize(tc.name)}.png`;
            const fpath = path.join(ssDir, fname);
            fs.writeFileSync(fpath, img, 'base64');
            screenshot = fpath;
            console.log(`     📸 Screenshot: ${fpath}`);
          } catch (_) {}
        }

        const duration = Date.now() - start;
        results.push({
          id: tcId,
          suite: suiteName,
          name: tc.name,
          status,
          duration,
          error,
          screenshot
        });
      }
    }
  } finally {
    console.log('\nClosing Chrome browser...');
    await driver.quit();
  }

  // ─── Generate Excel Report ──────────────────────────────────────────────
  console.log('\nGenerating Excel report...');
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();

    // Sheet 1: All results
    const wsData = results.map(r => ({
      'Test ID': r.id,
      'Suite': r.suite,
      'Test Name': r.name,
      'Status': r.status,
      'Duration (ms)': r.duration,
      'Error': r.error,
      'Screenshot': r.screenshot
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 8 }, { wch: 25 }, { wch: 55 }, { wch: 8 },
      { wch: 14 }, { wch: 50 }, { wch: 60 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'E2E Test Results');

    // Sheet 2: Suite summary
    const suiteMap = {};
    results.forEach(r => {
      if (!suiteMap[r.suite]) suiteMap[r.suite] = { pass: 0, fail: 0 };
      suiteMap[r.suite][r.status === 'PASS' ? 'pass' : 'fail']++;
    });
    const summData = Object.entries(suiteMap).map(([s, v]) => ({
      'Suite': s,
      'Total': v.pass + v.fail,
      'Passed': v.pass,
      'Failed': v.fail,
      'Pass Rate': ((v.pass / (v.pass + v.fail)) * 100).toFixed(1) + '%'
    }));
    const ws2 = XLSX.utils.json_to_sheet(summData);
    ws2['!cols'] = [{ wch: 30 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Suite Summary');

    const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const reportPath = path.resolve(__dirname, `hospiq-test-report-${ts}.xlsx`);
    XLSX.writeFile(wb, reportPath);
    console.log(`✅ Excel report: ${reportPath}`);
  } catch (err) {
    console.log(`⚠️  Excel generation failed: ${err.message}`);
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('');
  console.log('='.repeat(60));
  console.log('  HospiQ E2E Test Summary');
  console.log('='.repeat(60));
  console.log(`  Total     : ${results.length}`);
  console.log(`  Passed    : ${passed} ✅`);
  console.log(`  Failed    : ${failed} ❌`);
  console.log(`  Pass Rate : ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
