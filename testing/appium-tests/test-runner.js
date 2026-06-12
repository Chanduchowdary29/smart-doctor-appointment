const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Set ANDROID_HOME so Appium can find the Android SDK
process.env.ANDROID_HOME = 'C:\\Users\\cnaid\\AppData\\Local\\Android\\Sdk';
const net = require('net');
const { remote } = require('webdriverio');
const XLSX = require('xlsx');

const config = require('./config');
const serverManager = require('./server-manager');

// Test files to load and run (100 total test cases)
const testFiles = [
  './tests/patient.test.js',        // 20 tests - Patient E2E
  './tests/doctor.test.js',         // 20 tests - Doctor E2E
  './tests/patient-auth.test.js',   // 15 tests - Patient Authentication
  './tests/doctor-auth.test.js',    // 15 tests - Doctor Authentication
  './tests/patient-ui.test.js',     // 15 tests - Patient UI Validation
  './tests/doctor-ui.test.js'       // 15 tests - Doctor UI Validation
];

let appiumProcess = null;
let emulatorProcess = null;
let startedEmulator = false;

// Helper to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to check if a port is open
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Check if emulator is booted
function isEmulatorBooted() {
  try {
    const output = execSync(`"${config.adbPath}" shell getprop sys.boot_completed`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.trim() === '1';
  } catch (err) {
    return false;
  }
}

// Start Android Emulator if not running
async function ensureEmulatorRunning() {
  console.log("Checking if Android Emulator is running...");
  try {
    const devicesOutput = execSync(`"${config.adbPath}" devices`, { encoding: 'utf8' });
    const isRunning = devicesOutput.includes("emulator-");
    
    if (isRunning && isEmulatorBooted()) {
      console.log("Android Emulator is already active and booted.");
      return;
    }
    
    console.log(`Starting Android Emulator AVD "${config.avdName}"...`);
    startedEmulator = true;
    
    // Spawns emulator in background
    emulatorProcess = spawn(config.emulatorPath, ['-avd', config.avdName, '-no-snapshot-load', '-no-boot-anim'], {
      detached: true,
      stdio: 'ignore'
    });
    emulatorProcess.unref();

    console.log("Waiting for emulator to complete boot process (this may take up to 2-3 minutes)...");
    let booted = false;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes total
    
    while (!booted && attempts < maxAttempts) {
      attempts++;
      booted = isEmulatorBooted();
      if (!booted) {
        process.stdout.write(".");
        await sleep(2000);
      }
    }
    console.log("");
    
    if (!booted) {
      throw new Error(`Timeout: Emulator failed to boot after ${maxAttempts * 2} seconds.`);
    }
    console.log("Android Emulator successfully booted and ready.");
  } catch (err) {
    console.error("Error checking/starting emulator:", err.message);
    throw err;
  }
}

// Start Appium Server programmatically if not running
async function ensureAppiumServerRunning() {
  console.log("Checking if Appium server is running on port 4723...");
  const running = await isPortOpen('127.0.0.1', 4723);
  
  if (running) {
    console.log("Appium server is already running on port 4723.");
    return;
  }
  
  console.log("Appium server is offline. Starting Appium server locally...");
  
  const npxCmd = 'c:\\Users\\cnaid\\Downloads\\doc\\htdocs\\node-bin\\npx.cmd';
  appiumProcess = spawn(npxCmd, ['appium', '--port', '4723', '--use-drivers', 'uiautomator2'], {
    shell: true
  });

  appiumProcess.stdout.on('data', (data) => {
    console.log(`[Appium]: ${data.toString().trim()}`);
  });

  appiumProcess.stderr.on('data', (data) => {
    console.error(`[Appium Error]: ${data.toString().trim()}`);
  });

  console.log("Waiting for Appium server to start listening...");
  let attempts = 0;
  let started = false;
  const maxAttempts = 60;
  
  while (!started && attempts < maxAttempts) {
    attempts++;
    started = await isPortOpen('127.0.0.1', 4723);
    if (!started) {
      await sleep(1000);
    }
  }
  
  if (!started) {
    throw new Error("Timeout: Appium server failed to start on port 4723.");
  }
  console.log("Appium server is active and listening on port 4723.");
}

async function runAllTests() {
  console.log('==========================================');
  console.log('  Hospiq Mobile E2E Appium Test Runner');
  console.log('  100 Test Cases across 6 Test Suites');
  console.log('==========================================');

  // 1. Ensure screenshots directory exists
  if (!fs.existsSync(config.screenshotDir)) {
    fs.mkdirSync(config.screenshotDir, { recursive: true });
  }

  // 2. Start the local PHP API server
  try {
    await serverManager.start();
  } catch (err) {
    console.error("Critical: Failed to start PHP API server. Aborting tests.", err);
    process.exit(1);
  }

  // 3. Start Emulator and Appium
  try {
    await ensureEmulatorRunning();
    await ensureAppiumServerRunning();
  } catch (err) {
    console.error("Critical environmental failure. Aborting tests.", err);
    await cleanup();
    process.exit(1);
  }

  // 4. Initialize Appium Driver Client session
  console.log("\nInitializing Appium Driver Session...");
  let driver;
  try {
    driver = await remote({
      protocol: 'http',
      hostname: '127.0.0.1',
      port: 4723,
      path: '/',
      capabilities: config.capabilities
    });
    console.log("Appium Driver Session initialized successfully.");
  } catch (err) {
    console.error("Critical: Failed to initialize Appium session.", err);
    await cleanup();
    process.exit(1);
  }

  const results = [];
  let totalCases = 0;
  let passedCases = 0;
  let failedCases = 0;

  // 5. Run the test suites
  try {
    for (const file of testFiles) {
      const suitePath = path.resolve(__dirname, file);
      if (!fs.existsSync(suitePath)) {
        console.warn(`Warning: Test suite file not found: ${file}`);
        continue;
      }

      console.log(`\n------------------------------------------`);
      console.log(`Running Suite: ${file}`);
      console.log(`------------------------------------------`);

      const suite = require(file);
      for (const testCase of suite.testCases) {
        totalCases++;
        console.log(`[Test #${totalCases}] Running: "${testCase.name}"...`);
        
        const startTime = Date.now();
        let status = 'Pass';
        let errorMessage = '';
        let screenshotPath = '';

        try {
          // Execute test case function
          await testCase.fn(driver, config);
          passedCases++;
          console.log(`  -> RESULT: PASS`);
        } catch (err) {
          status = 'Fail';
          failedCases++;
          errorMessage = err.message || err.toString();
          console.error(`  -> RESULT: FAIL`);
          console.error(`     Error: ${errorMessage}`);

          // Take screenshot on failure
          try {
            const safeName = testCase.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `fail_${totalCases}_${safeName}.png`;
            const filePath = path.join(config.screenshotDir, fileName);
            await driver.saveScreenshot(filePath);
            screenshotPath = filePath;
            console.log(`     Screenshot saved: ${filePath}`);
          } catch (screenshotErr) {
            console.error("     Failed to capture screenshot:", screenshotErr.message);
          }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2); // in seconds
        const padded = totalCases.toString().padStart(3, '0');
        results.push({
          "Test ID": `TC_MOB_${padded}`,
          "Suite Name": suite.name,
          "Test Case Name": testCase.name,
          "Status": status,
          "Duration (s)": parseFloat(duration),
          "Execution Time": new Date().toLocaleString(),
          "Verification Details": status === 'Pass' ? 'Verified successfully' : 'Validation error occurred',
          "Error Message": errorMessage,
          "Screenshot Location": screenshotPath || 'N/A'
        });
      }
    }
  } catch (err) {
    console.error("An unexpected error occurred during test execution:", err);
  } finally {
    // 6. Quit driver session
    console.log("\nClosing Appium driver session...");
    if (driver) {
      try {
        await driver.deleteSession();
        console.log("Appium driver session closed.");
      } catch (err) {
        console.error("Error deleting driver session:", err);
      }
    }
    await cleanup();
  }

  // 7. Generate Excel Report
  console.log('\nGenerating Excel report...');
  try {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Full Test Results ──
    const ws = XLSX.utils.json_to_sheet(results);
    ws['!cols'] = [
      { wch: 12 },  // Test ID
      { wch: 35 },  // Suite Name
      { wch: 50 },  // Test Case Name
      { wch: 8  },  // Status
      { wch: 12 },  // Duration
      { wch: 22 },  // Execution Time
      { wch: 30 },  // Verification Details
      { wch: 55 },  // Error Message
      { wch: 60 }   // Screenshot Location
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Mobile E2E Test Results');

    // ── Sheet 2: Suite Summary ──
    const suiteMap = {};
    results.forEach(r => {
      if (!suiteMap[r['Suite Name']]) suiteMap[r['Suite Name']] = { pass: 0, fail: 0 };
      if (r['Status'] === 'Pass') suiteMap[r['Suite Name']].pass++;
      else suiteMap[r['Suite Name']].fail++;
    });
    const summaryData = Object.entries(suiteMap).map(([suite, counts]) => ({
      'Suite Name': suite,
      'Total': counts.pass + counts.fail,
      'Passed': counts.pass,
      'Failed': counts.fail,
      'Pass Rate': `${(((counts.pass) / (counts.pass + counts.fail)) * 100).toFixed(1)}%`
    }));
    summaryData.push({
      'Suite Name': '--- TOTAL ---',
      'Total': totalCases,
      'Passed': passedCases,
      'Failed': failedCases,
      'Pass Rate': `${totalCases > 0 ? ((passedCases / totalCases) * 100).toFixed(1) : 0}%`
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Suite Summary');

    XLSX.writeFile(wb, config.reportPath);
    console.log(`✅ Excel report generated: ${config.reportPath}`);
  } catch (err) {
    console.error('Failed to generate Excel report:', err);
  }

  // 8. Print Console Summary
  const passRate = totalCases > 0 ? ((passedCases / totalCases) * 100).toFixed(1) : 0;
  console.log('\n==========================================');
  console.log('  Mobile E2E Test Execution Summary');
  console.log('==========================================');
  console.log(`  Total Test Cases : ${totalCases}`);
  console.log(`  Passed           : ${passedCases} ✅`);
  console.log(`  Failed           : ${failedCases} ❌`);
  console.log(`  Pass Rate        : ${passRate}%`);
  console.log(`  Excel Report     : ${config.reportPath}`);
  console.log('==========================================');
}

// Clean up spawned services
async function cleanup() {
  console.log("\nPerforming cleanup of spawned processes...");
  
  if (appiumProcess) {
    console.log("Stopping Appium server...");
    try {
      appiumProcess.kill('SIGKILL');
    } catch (err) {
      console.error("Error killing Appium process:", err);
    }
  }
  
  await serverManager.stop();
  
  if (startedEmulator) {
    console.log("Shutting down Android emulator...");
    try {
      execSync(`"${config.adbPath}" emu kill`, { stdio: 'ignore' });
      console.log("Android emulator shutdown command sent.");
    } catch (err) {
      // ignore
    }
  }
  
  console.log("Cleanup complete.");
}

runAllTests().catch(console.error);
