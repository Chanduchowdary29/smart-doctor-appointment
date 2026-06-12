// Suite 6: Doctor Dashboard (doctor.html) Tests (15 tests)
const { By, until } = require('selenium-webdriver');

module.exports = {
  testCases: [
    {
      name: 'Verify doctor.html loads successfully',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'doctor'); localStorage.setItem('hospiq_name', 'Dr. Test');"); await driver.get(`${config.baseUrl}/doctor.html`);
        await driver.sleep(1500);
        const title = await driver.getTitle();
        if (!title.includes('Doctor')) throw new Error(`Title: "${title}"`);
        console.log(`  Title: "${title}"`);
      }
    },
    {
      name: 'Verify doctor navbar has "Doctor" badge',
      fn: async (driver, config) => {
        
        if (!(await driver.getPageSource()).includes('Doctor')) throw new Error('No Doctor badge');
        console.log('  Doctor badge present in navbar');
      }
    },
    {
      name: 'Verify doctor navbar has Dashboard link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dnav-dashboard'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Dashboard')) throw new Error(`Dash: "${text}"`);
        console.log('  Dashboard nav link present');
      }
    },
    {
      name: 'Verify doctor navbar has Schedule link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dnav-appointments'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Schedule')) throw new Error(`Sched: "${text}"`);
        console.log('  Schedule nav link present');
      }
    },
    {
      name: 'Verify doctor navbar has Hospital link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dnav-hospital'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Hospital')) throw new Error(`Hosp: "${text}"`);
        console.log('  Hospital nav link present');
      }
    },
    {
      name: 'Verify doctor navbar has Alerts link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dnav-notifications'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Alert')) throw new Error(`Alerts: "${text}"`);
        console.log('  Alerts nav link present');
      }
    },
    {
      name: 'Verify doctor navbar has Profile link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dnav-profile'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Profile')) throw new Error(`Profile: "${text}"`);
        console.log('  Profile nav link present');
      }
    },
    {
      name: 'Verify dashboard section is active',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('view-dashboard'));
        const cls = await el.getAttribute('class');
        if (!cls.includes('active')) throw new Error(`Class: ${cls}`);
        console.log('  Dashboard section is active');
      }
    },
    {
      name: 'Verify dashboard greeting text',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dash-greeting'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Good') && !text.includes('👋')) throw new Error(`Greeting: "${text}"`);
        console.log(`  Greeting: "${text}"`);
      }
    },
    {
      name: 'Verify "Schedule for today" subtitle',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.css('.greeting-sub'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Schedule')) throw new Error(`Sub: "${text}"`);
        console.log(`  Subtitle: "${text}"`);
      }
    },
    {
      name: 'Verify doctor appointments section exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('view-doctor-appointments'));
        if (!el) throw new Error('No appointments section');
        console.log('  Doctor appointments section found');
      }
    },
    {
      name: 'Verify appointment filter chips (All, Pending, Accepted, etc.)',
      fn: async (driver, config) => {
        const chips = await driver.findElements(By.css('#view-doctor-appointments .chip'));
        if (chips.length < 4) throw new Error(`Only ${chips.length} chips`);
        const texts = [];
        for (const c of chips) texts.push(await c.getAttribute('textContent'));
        console.log(`  Filter chips: ${texts.join(', ')}`);
      }
    },
    {
      name: 'Verify doctor hospital section exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('view-doctor-hospital'));
        if (!el) throw new Error('No hospital section');
        console.log('  Doctor hospital section found');
      }
    },
    {
      name: 'Verify reschedule modal exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('reschedule-modal'));
        if (!el) throw new Error('No reschedule modal');
        console.log('  Reschedule modal found');
      }
    },
    {
      name: 'Verify slot creator modal exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('slot-modal'));
        if (!el) throw new Error('No slot modal');
        
        if (!(await driver.getPageSource()).includes('Create Slots')) throw new Error('No Create Slots text');
        console.log('  Slot creator modal found');
      }
    }
  ]
};
