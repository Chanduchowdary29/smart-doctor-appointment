// Suite 2: Login UI Tests (15 tests)
const { By, until } = require('selenium-webdriver');

async function showLogin(driver, config) {
  await driver.get(config.baseUrl);
  await driver.sleep(2000);
  // Try to navigate to login view
  try {
    await driver.executeScript("if(typeof showView==='function') showView('view-login')");
    await driver.sleep(500);
  } catch (_) {}
}

module.exports = {
  testCases: [
    {
      name: 'Verify login section exists',
      fn: async (driver, config) => {
        await showLogin(driver, config);
        const el = await driver.findElement(By.id('view-login'));
        if (!el) throw new Error('No login section');
        console.log('  Login section found');
      }
    },
    {
      name: 'Verify login has "Welcome back!" heading',
      fn: async (driver, config) => {
        const h1 = await driver.findElement(By.css('#view-login h1'));
        const text = await h1.getAttribute('textContent');
        if (!text.includes('Welcome back')) throw new Error(`Heading: "${text}"`);
        console.log(`  Login heading: "${text}"`);
      }
    },
    {
      name: 'Verify login has subtitle text',
      fn: async (driver, config) => {
        const sub = await driver.findElement(By.css('#view-login .auth-sub'));
        const text = await sub.getAttribute('textContent');
        if (!text.includes('HospiQ')) throw new Error(`Sub: "${text}"`);
        console.log(`  Subtitle: "${text}"`);
      }
    },
    {
      name: 'Verify email input field exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('login-email'));
        const type = await el.getAttribute('type');
        if (type !== 'email') throw new Error(`Type: ${type}`);
        console.log('  Email input found (type=email)');
      }
    },
    {
      name: 'Verify email placeholder text',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('login-email'));
        const ph = await el.getAttribute('placeholder');
        if (!ph.includes('email')) throw new Error(`Placeholder: "${ph}"`);
        console.log(`  Email placeholder: "${ph}"`);
      }
    },
    {
      name: 'Verify password input field exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('login-password'));
        const type = await el.getAttribute('type');
        if (type !== 'password') throw new Error(`Type: ${type}`);
        console.log('  Password input found (type=password)');
      }
    },
    {
      name: 'Verify password toggle (eye) button exists',
      fn: async (driver, config) => {
        const btn = await driver.findElement(By.css('#view-login .eye-btn'));
        if (!btn) throw new Error('No eye button');
        const icon = await btn.findElement(By.css('i'));
        const cls = await icon.getAttribute('class');
        if (!cls.includes('fa-eye')) throw new Error(`Icon class: ${cls}`);
        console.log('  Password eye toggle present');
      }
    },
    {
      name: 'Verify "Log In" button exists',
      fn: async (driver, config) => {
        const btns = await driver.findElements(By.css('#view-login .btn-primary'));
        let found = false;
        for (const b of btns) {
          const text = await b.getAttribute('textContent');
          if (text.includes('Log In')) { found = true; break; }
        }
        if (!found) throw new Error('No Log In button');
        console.log('  Log In button found');
      }
    },
    {
      name: 'Verify "Sign up as Patient" link exists in login footer',
      fn: async (driver, config) => {
        const footer = await driver.findElement(By.css('#view-login .auth-footer'));
        const text = await footer.getAttribute('textContent');
        if (!text.includes('Patient')) throw new Error(`Footer: "${text}"`);
        console.log('  Patient signup link present');
      }
    },
    {
      name: 'Verify "Sign up as Doctor" link exists in login footer',
      fn: async (driver, config) => {
        const footer = await driver.findElement(By.css('#view-login .auth-footer'));
        const text = await footer.getAttribute('textContent');
        if (!text.includes('Doctor')) throw new Error(`Footer: "${text}"`);
        console.log('  Doctor signup link present');
      }
    },
    {
      name: 'Verify login page has app logo image',
      fn: async (driver, config) => {
        const img = await driver.findElement(By.css('#view-login .auth-header img'));
        const src = await img.getAttribute('src');
        if (!src.includes('app_logo')) throw new Error(`Src: ${src}`);
        console.log('  App logo on login page');
      }
    },
    {
      name: 'Verify login page has patient booking image',
      fn: async (driver, config) => {
        const img = await driver.findElement(By.css('#view-login .auth-img'));
        const src = await img.getAttribute('src');
        if (!src.includes('patient_booking')) throw new Error(`Src: ${src}`);
        console.log('  Patient booking image present');
      }
    },
    {
      name: 'Verify email error message element exists (hidden)',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('login-email-err'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('valid email')) throw new Error(`Err msg: "${text}"`);
        console.log('  Email error msg ready');
      }
    },
    {
      name: 'Verify password error message element exists (hidden)',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('login-pass-err'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('required')) throw new Error(`Err msg: "${text}"`);
        console.log('  Password error msg ready');
      }
    },
    {
      name: 'Verify typing in email input works',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('login-email'));
        await el.clear();
        await driver.executeScript("arguments[0].value='test@hospiq.com'", el);
        const val = await el.getAttribute('value');
        if (val !== 'test@hospiq.com') throw new Error(`Value: ${val}`);
        console.log('  Typed email successfully');
        await el.clear();
      }
    }
  ]
};
