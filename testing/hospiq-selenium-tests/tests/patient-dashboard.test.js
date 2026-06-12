// Suite 5: Patient Dashboard (patient.html) Tests (15 tests)
const { By, until } = require('selenium-webdriver');

module.exports = {
  testCases: [
    {
      name: 'Verify patient.html loads successfully',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl + '/'); await driver.executeScript("localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'patient'); localStorage.setItem('hospiq_name', 'Test Patient');"); await driver.get(`${config.baseUrl}/patient.html`);
        await driver.sleep(1500);
        const title = await driver.getTitle();
        if (!title.includes('Patient')) throw new Error(`Title: "${title}"`);
        console.log(`  Title: "${title}"`);
      }
    },
    {
      name: 'Verify patient page has top navbar',
      fn: async (driver, config) => {
        const nav = await driver.findElement(By.css('.top-navbar'));
        if (!nav) throw new Error('No top-navbar');
        console.log('  Top navbar present');
      }
    },
    {
      name: 'Verify navbar has HospiQ logo text',
      fn: async (driver, config) => {
        const logo = await driver.findElement(By.css('.navbar-logo span'));
        const text = await logo.getAttribute('textContent');
        if (!text.includes('HospiQ')) throw new Error(`Logo: "${text}"`);
        console.log(`  Navbar logo: "${text}"`);
      }
    },
    {
      name: 'Verify navbar has Home link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('nav-home'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Home')) throw new Error(`Home: "${text}"`);
        console.log('  Home nav link present');
      }
    },
    {
      name: 'Verify navbar has Search link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('nav-search'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Search')) throw new Error(`Search: "${text}"`);
        console.log('  Search nav link present');
      }
    },
    {
      name: 'Verify navbar has Appointments link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('nav-appointments'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Appointment')) throw new Error(`Appt: "${text}"`);
        console.log('  Appointments nav link present');
      }
    },
    {
      name: 'Verify navbar has Alerts link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('nav-notifications'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Alert')) throw new Error(`Alerts: "${text}"`);
        console.log('  Alerts nav link present');
      }
    },
    {
      name: 'Verify navbar has Profile link',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('nav-profile'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Profile')) throw new Error(`Profile: "${text}"`);
        console.log('  Profile nav link present');
      }
    },
    {
      name: 'Verify home view section exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('view-home'));
        if (!el) throw new Error('No view-home');
        console.log('  view-home section found');
      }
    },
    {
      name: 'Verify greeting text is present',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('home-greeting'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('Good') && !text.includes('👋')) throw new Error(`Greeting: "${text}"`);
        console.log(`  Greeting: "${text}"`);
      }
    },
    {
      name: 'Verify "Hospitals Near You" section exists',
      fn: async (driver, config) => {
        
        if (!(await driver.getPageSource()).includes('Hospitals Near You')) throw new Error('No Hospitals Near You section');
        console.log('  Hospitals Near You section found');
      }
    },
    {
      name: 'Verify "Browse by Specialty" section exists',
      fn: async (driver, config) => {
        
        if (!(await driver.getPageSource()).includes('Browse by Specialty')) throw new Error('No specialty section');
        console.log('  Browse by Specialty section found');
      }
    },
    {
      name: 'Verify specialty tiles (Cardiology, Neurology, etc.) exist',
      fn: async (driver, config) => {
        const tiles = await driver.findElements(By.css('#view-home .specialty-tile'));
        if (tiles.length < 6) throw new Error(`Only ${tiles.length} tiles`);
        console.log(`  ${tiles.length} specialty tiles found`);
      }
    },
    {
      name: 'Verify search bar placeholder text',
      fn: async (driver, config) => {
        const input = await driver.findElement(By.css('#view-home .search-bar input'));
        const ph = await input.getAttribute('placeholder');
        if (!ph.includes('Search')) throw new Error(`Placeholder: "${ph}"`);
        console.log(`  Search placeholder: "${ph}"`);
      }
    },
    {
      name: 'Verify FAB (floating action button) exists for Quick Book',
      fn: async (driver, config) => {
        const fab = await driver.findElement(By.css('.fab-btn'));
        const title = await fab.getAttribute('title');
        if (!title.includes('Book')) throw new Error(`FAB title: "${title}"`);
        console.log('  FAB quick book button present');
      }
    }
  ]
};
