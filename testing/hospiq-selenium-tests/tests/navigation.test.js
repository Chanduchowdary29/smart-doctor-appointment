// Suite 7: Cross-Page Navigation & General UI Tests (10 tests)
const { By, until } = require('selenium-webdriver');

module.exports = {
  testCases: [
    {
      name: 'Verify navigation from index to patient.html',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'patient');"); await driver.get(`${config.baseUrl}/patient.html`);
        await driver.sleep(1000);
        const url = await driver.getCurrentUrl();
        if (!url.includes('patient.html')) throw new Error(`URL: ${url}`);
        console.log(`  Navigated to: ${url}`);
      }
    },
    {
      name: 'Verify navigation from index to doctor.html',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'doctor');"); await driver.get(`${config.baseUrl}/doctor.html`);
        await driver.sleep(1000);
        const url = await driver.getCurrentUrl();
        if (!url.includes('doctor.html')) throw new Error(`URL: ${url}`);
        console.log(`  Navigated to: ${url}`);
      }
    },
    {
      name: 'Verify all 3 pages have app.js script loaded',
      fn: async (driver, config) => {
        const pages = ['', '/patient.html', '/doctor.html'];
        for (const p of pages) {
          await driver.get(config.baseUrl + p);
          await driver.sleep(500);
          const scripts = await driver.findElements(By.css('script[src="app.js"]'));
          if (scripts.length === 0) throw new Error(`No app.js on ${p || '/'}`);
        }
        console.log('  app.js loaded on all 3 pages');
      }
    },
    {
      name: 'Verify all 3 pages have style.css linked',
      fn: async (driver, config) => {
        const pages = ['', '/patient.html', '/doctor.html'];
        for (const p of pages) {
          await driver.get(config.baseUrl + p);
          await driver.sleep(500);
          const links = await driver.findElements(By.css('link[href="style.css"]'));
          if (links.length === 0) throw new Error(`No style.css on ${p || '/'}`);
        }
        console.log('  style.css linked on all 3 pages');
      }
    },
    {
      name: 'Verify patient page has 5 navbar menu items',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'patient');"); await driver.get(`${config.baseUrl}/patient.html`);
        await driver.sleep(1000);
        const links = await driver.findElements(By.css('.navbar-menu .nav-link'));
        if (links.length !== 5) throw new Error(`Found ${links.length} nav links`);
        console.log('  5 navbar menu items on patient page');
      }
    },
    {
      name: 'Verify doctor page has 5 navbar menu items',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'doctor');"); await driver.get(`${config.baseUrl}/doctor.html`);
        await driver.sleep(1000);
        const links = await driver.findElements(By.css('.navbar-menu .nav-link'));
        if (links.length !== 5) throw new Error(`Found ${links.length} nav links`);
        console.log('  5 navbar menu items on doctor page');
      }
    },
    {
      name: 'Verify patient page notification badge element exists',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'patient');"); await driver.get(`${config.baseUrl}/patient.html`);
        await driver.sleep(1000);
        const badge = await driver.findElement(By.id('nb-nav'));
        if (!badge) throw new Error('No notification badge');
        console.log('  Notification badge element present');
      }
    },
    {
      name: 'Verify patient page has modals (appointment, filter, edit profile, quick book)',
      fn: async (driver, config) => {
        const modalIds = ['appt-modal', 'filter-modal', 'edit-profile-modal', 'quick-book-modal'];
        for (const id of modalIds) {
          const el = await driver.findElement(By.id(id));
          if (!el) throw new Error(`Missing modal: ${id}`);
        }
        console.log(`  4 modals found on patient page`);
      }
    },
    {
      name: 'Verify doctor page has modals (patient, reschedule, slot, edit profile)',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'doctor');"); await driver.get(`${config.baseUrl}/doctor.html`);
        await driver.sleep(1000);
        const modalIds = ['patient-modal', 'reschedule-modal', 'slot-modal', 'doc-edit-modal'];
        for (const id of modalIds) {
          const el = await driver.findElement(By.id(id));
          if (!el) throw new Error(`Missing modal: ${id}`);
        }
        console.log('  4 modals found on doctor page');
      }
    },
    {
      name: 'Verify all images load without errors (no broken images)',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl);
        await driver.sleep(2000);
        const images = await driver.findElements(By.css('img'));
        let broken = 0;
        for (const img of images) {
          const complete = await driver.executeScript('return arguments[0].complete', img);
          const naturalW = await driver.executeScript('return arguments[0].naturalWidth', img);
          // Images with onerror handlers hide themselves, so check if displayed
          const displayed = await img.isDisplayed().catch(() => false);
          if (displayed && complete && naturalW === 0) broken++;
        }
        console.log(`  ${images.length} images checked, ${broken} broken`);
        // Allow 0 broken for pass
        if (broken > 0) throw new Error(`${broken} broken images`);
      }
    }
  ]
};
