const path = require('path');

module.exports = {
  // Mobile testing capabilities
  capabilities: {
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:automationName': 'UiAutomator2',
    'appium:app': 'C:\\Users\\cnaid\\StudioProjects\\hospiq\\app\\build\\intermediates\\apk\\debug\\app-debug.apk',
    'appium:appPackage': 'com.simats.hospiq',
    'appium:appActivity': 'com.simats.hospiq.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240
  },

  // Android SDK Tooling Paths
  adbPath: 'C:\\Users\\cnaid\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe',
  emulatorPath: 'C:\\Users\\cnaid\\AppData\\Local\\Android\\Sdk\\emulator\\emulator.exe',
  avdName: 'AppTestingphone',

  // PHP Server Configuration
  port: 80,
  phpPath: 'c:\\Users\\cnaid\\Downloads\\doc\\php\\php.exe',
  apiHost: '127.0.0.1',
  htdocsPath: 'c:\\xampp\\htdocs',

  // Paths for reporting (timestamped to avoid EBUSY lock when open in Excel)
  reportPath: path.resolve(__dirname, `test-report-${new Date().toISOString().replace(/[:.]/g, '-').slice(0,19)}.xlsx`),
  screenshotDir: path.resolve(__dirname, 'screenshots'),
  
  // Timeout settings
  timeout: 30000 // ms
};
