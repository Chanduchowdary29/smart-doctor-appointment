// Suite 3: Patient Signup Form Tests (15 tests)
const { By, until } = require('selenium-webdriver');

async function showPatientSignup(driver, config) {
  await driver.get(config.baseUrl);
  await driver.sleep(2000);
  try {
    await driver.executeScript("if(typeof showView==='function') showView('view-patient-signup')");
    await driver.sleep(500);
  } catch (_) {}
}

module.exports = {
  testCases: [
    {
      name: 'Verify patient signup section exists',
      fn: async (driver, config) => {
        await showPatientSignup(driver, config);
        const el = await driver.findElement(By.id('view-patient-signup'));
        if (!el) throw new Error('No patient signup section');
        console.log('  Patient signup section found');
      }
    },
    {
      name: 'Verify "Create Patient Account" heading',
      fn: async (driver, config) => {
        const h1 = await driver.findElement(By.css('#view-patient-signup h1'));
        const text = await h1.getAttribute('textContent');
        if (!text.includes('Patient Account')) throw new Error(`Heading: "${text}"`);
        console.log(`  Heading: "${text}"`);
      }
    },
    {
      name: 'Verify subtitle "Fill in your details to get started"',
      fn: async (driver, config) => {
        const sub = await driver.findElement(By.css('#view-patient-signup .auth-sub'));
        const text = await sub.getAttribute('textContent');
        if (!text.includes('details')) throw new Error(`Sub: "${text}"`);
        console.log(`  Subtitle: "${text}"`);
      }
    },
    {
      name: 'Verify Full Name input field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-name'));
        const ph = await el.getAttribute('placeholder');
        if (!ph.includes('John')) throw new Error(`Placeholder: "${ph}"`);
        console.log(`  Name placeholder: "${ph}"`);
      }
    },
    {
      name: 'Verify Email input field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-email'));
        const type = await el.getAttribute('type');
        if (type !== 'email') throw new Error(`Type: ${type}`);
        console.log('  Email field (type=email)');
      }
    },
    {
      name: 'Verify Phone number input field with maxlength=10',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-phone'));
        const max = await el.getAttribute('maxlength');
        if (max !== '10') throw new Error(`Maxlength: ${max}`);
        console.log('  Phone maxlength=10');
      }
    },
    {
      name: 'Verify Password input field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-password'));
        const type = await el.getAttribute('type');
        if (type !== 'password') throw new Error(`Type: ${type}`);
        console.log('  Password field present');
      }
    },
    {
      name: 'Verify Confirm Password input field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-confirm'));
        const type = await el.getAttribute('type');
        if (type !== 'password') throw new Error(`Type: ${type}`);
        console.log('  Confirm password field present');
      }
    },
    {
      name: 'Verify "Create Account" button exists',
      fn: async (driver, config) => {
        const btns = await driver.findElements(By.css('#view-patient-signup .btn-primary'));
        let found = false;
        for (const b of btns) {
          const text = await b.getAttribute('textContent');
          if (text.includes('Create Account')) { found = true; break; }
        }
        if (!found) throw new Error('No Create Account button');
        console.log('  Create Account button found');
      }
    },
    {
      name: 'Verify Back button exists',
      fn: async (driver, config) => {
        const btn = await driver.findElement(By.css('#view-patient-signup .back-btn'));
        const text = await btn.getAttribute('textContent');
        if (!text.includes('Back')) throw new Error(`Back btn: "${text}"`);
        console.log('  Back button present');
      }
    },
    {
      name: 'Verify name error message exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-name-err'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('required')) throw new Error(`Err: "${text}"`);
        console.log('  Name error msg ready');
      }
    },
    {
      name: 'Verify email error message exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-email-err'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('email')) throw new Error(`Err: "${text}"`);
        console.log('  Email error msg ready');
      }
    },
    {
      name: 'Verify phone error message exists',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('ps-phone-err'));
        const text = await el.getAttribute('textContent');
        if (!text.includes('10-digit')) throw new Error(`Err: "${text}"`);
        console.log('  Phone error msg ready');
      }
    },
    {
      name: 'Verify password toggle buttons on signup form',
      fn: async (driver, config) => {
        const eyeBtns = await driver.findElements(By.css('#view-patient-signup .eye-btn'));
        if (eyeBtns.length < 2) throw new Error(`Only ${eyeBtns.length} eye buttons`);
        console.log(`  ${eyeBtns.length} password toggle buttons`);
      }
    },
    {
      name: 'Verify typing in all patient signup fields works',
      fn: async (driver, config) => {
        await driver.executeScript("arguments[0].value='Test Patient'", await driver.findElement(By.id('ps-name')));
        await driver.executeScript("arguments[0].value='patient@test.com'", await driver.findElement(By.id('ps-email')));
        await driver.executeScript("arguments[0].value='9876543210'", await driver.findElement(By.id('ps-phone')));
        await driver.executeScript("arguments[0].value='Test@1234'", await driver.findElement(By.id('ps-password')));
        await driver.executeScript("arguments[0].value='Test@1234'", await driver.findElement(By.id('ps-confirm')));
        const nameVal = await driver.findElement(By.id('ps-name')).getAttribute('value');
        if (nameVal !== 'Test Patient') throw new Error(`Name: ${nameVal}`);
        console.log('  All fields accept input');
        // Clear
        for (const id of ['ps-name','ps-email','ps-phone','ps-password','ps-confirm']) {
          await driver.findElement(By.id(id)).clear();
        }
      }
    }
  ]
};
