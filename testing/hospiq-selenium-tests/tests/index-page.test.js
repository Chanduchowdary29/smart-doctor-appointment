// Suite 1: Index / Splash / Landing Page Tests (15 tests)
const { By, until } = require('selenium-webdriver');

module.exports = {
  testCases: [
    {
      name: 'Verify HospiQ index page loads successfully',
      fn: async (driver, config, sel) => {
        await driver.get(config.baseUrl);
        await driver.sleep(1500);
        const title = await driver.getTitle();
        if (!title.includes('HospiQ')) throw new Error(`Title is: "${title}"`);
        console.log(`  Page title: "${title}"`);
      }
    },
    {
      name: 'Verify page has DOCTYPE html',
      fn: async (driver, config) => {
        
        if (!await driver.executeScript('return document.doctype !== null')) throw new Error('No DOCTYPE');
      }
    },
    {
      name: 'Verify page has correct meta charset UTF-8',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.css('meta[charset]'));
        const charset = await el.getAttribute('charset');
        if (charset.toLowerCase() !== 'utf-8') throw new Error(`Charset: ${charset}`);
        console.log('  Charset: UTF-8');
      }
    },
    {
      name: 'Verify page has viewport meta tag',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.css('meta[name="viewport"]'));
        const content = await el.getAttribute('content');
        if (!content.includes('width=device-width')) throw new Error(`Viewport: ${content}`);
        console.log('  Viewport meta present');
      }
    },
    {
      name: 'Verify splash screen section exists',
      fn: async (driver, config) => {
        await driver.get(config.baseUrl);
        await driver.sleep(500);
        const el = await driver.findElement(By.id('view-splash'));
        if (!el) throw new Error('No splash section');
        console.log('  Splash section found');
      }
    },
    {
      name: 'Verify splash screen has HospiQ heading',
      fn: async (driver, config) => {
        const h1 = await driver.findElement(By.css('#view-splash h1'));
        const text = await h1.getAttribute('textContent');
        if (!text.includes('HospiQ')) throw new Error(`Heading: "${text}"`);
        console.log(`  Splash heading: "${text}"`);
      }
    },
    {
      name: 'Verify splash has "Your Health, Simplified" tagline',
      fn: async (driver, config) => {
        const p = await driver.findElement(By.css('#view-splash p'));
        const text = await p.getAttribute('textContent');
        if (!text.includes('Health')) throw new Error(`Tagline: "${text}"`);
        console.log(`  Tagline: "${text}"`);
      }
    },
    {
      name: 'Verify app logo image exists on splash',
      fn: async (driver, config) => {
        const img = await driver.findElement(By.css('#view-splash img'));
        const src = await img.getAttribute('src');
        if (!src.includes('app_logo')) throw new Error(`Logo src: ${src}`);
        console.log('  App logo found on splash');
      }
    },
    {
      name: 'Verify Font Awesome CSS is loaded',
      fn: async (driver, config) => {
        const links = await driver.findElements(By.css('link[rel="stylesheet"]'));
        let found = false;
        for (const l of links) {
          const href = await l.getAttribute('href');
          if (href && href.includes('font-awesome')) { found = true; break; }
        }
        if (!found) throw new Error('Font Awesome not found');
        console.log('  Font Awesome CSS loaded');
      }
    },
    {
      name: 'Verify style.css is linked',
      fn: async (driver, config) => {
        const links = await driver.findElements(By.css('link[rel="stylesheet"]'));
        let found = false;
        for (const l of links) {
          const href = await l.getAttribute('href');
          if (href && href.includes('style.css')) { found = true; break; }
        }
        if (!found) throw new Error('style.css not linked');
        console.log('  style.css linked');
      }
    },
    {
      name: 'Verify onboarding section exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('view-onboarding'));
        if (!el) throw new Error('No onboarding');
        console.log('  Onboarding section found');
      }
    },
    {
      name: 'Verify onboarding has "Sign up as Patient" button',
      fn: async (driver, config) => {
        const btns = await driver.findElements(By.css('#view-onboarding .btn-primary'));
        let found = false;
        for (const b of btns) {
          const text = await b.getAttribute('textContent');
          if (text.includes('Patient')) { found = true; break; }
        }
        if (!found) throw new Error('No Patient signup button');
        console.log('  Patient signup button found');
      }
    },
    {
      name: 'Verify onboarding has "Sign up as Doctor" button',
      fn: async (driver, config) => {
        const btns = await driver.findElements(By.css('#view-onboarding .btn-secondary'));
        let found = false;
        for (const b of btns) {
          const text = await b.getAttribute('textContent');
          if (text.includes('Doctor')) { found = true; break; }
        }
        if (!found) throw new Error('No Doctor signup button');
        console.log('  Doctor signup button found');
      }
    },
    {
      name: 'Verify onboarding has doctor standing image',
      fn: async (driver, config) => {
        const img = await driver.findElement(By.css('#view-onboarding img'));
        const src = await img.getAttribute('src');
        if (!src.includes('doctor_standing')) throw new Error(`Image: ${src}`);
        console.log('  Doctor standing image present');
      }
    },
    {
      name: 'Verify page loads within 5 seconds',
      fn: async (driver, config) => {
        const start = Date.now();
        await driver.get(config.baseUrl);
        await driver.wait(until.elementLocated(By.id('view-splash')), 5000);
        const dur = Date.now() - start;
        console.log(`  Page loaded in ${dur}ms`);
      }
    }
  ]
};
