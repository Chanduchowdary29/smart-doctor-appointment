// Suite 4: Doctor Registration Form Tests (15 tests)
const { By, until } = require('selenium-webdriver');

async function showDoctorReg(driver, config) {
  await driver.get(config.baseUrl);
  await driver.sleep(2000);
  try {
    await driver.executeScript("if(typeof showView==='function') showView('view-doctor-register')");
    await driver.sleep(500);
  } catch (_) {}
}

module.exports = {
  testCases: [
    {
      name: 'Verify doctor registration section exists',
      fn: async (driver, config) => {
        await showDoctorReg(driver, config);
        const el = await driver.findElement(By.id('view-doctor-register'));
        if (!el) throw new Error('No doctor register section');
        console.log('  Doctor register section found');
      }
    },
    {
      name: 'Verify "Doctor Registration" heading',
      fn: async (driver, config) => {
        const h1 = await driver.findElement(By.css('#view-doctor-register h1'));
        const text = await h1.getAttribute('textContent');
        if (!text.includes('Doctor Registration')) throw new Error(`Heading: "${text}"`);
        console.log(`  Heading: "${text}"`);
      }
    },
    {
      name: 'Verify "Complete all 3 steps" subtitle',
      fn: async (driver, config) => {
        const sub = await driver.findElement(By.css('#view-doctor-register .auth-sub'));
        const text = await sub.getAttribute('textContent');
        if (!text.includes('3 steps')) throw new Error(`Sub: "${text}"`);
        console.log(`  Subtitle: "${text}"`);
      }
    },
    {
      name: 'Verify 3 step indicator dots exist',
      fn: async (driver, config) => {
        const dots = await driver.findElements(By.css('#step-indicators .step-dot'));
        if (dots.length !== 3) throw new Error(`Found ${dots.length} dots`);
        console.log('  3 step dots found');
      }
    },
    {
      name: 'Verify step 1 is active by default',
      fn: async (driver, config) => {
        const dot1 = await driver.findElement(By.id('step-dot-1'));
        const cls = await dot1.getAttribute('class');
        if (!cls.includes('active')) throw new Error(`Step 1 class: ${cls}`);
        console.log('  Step 1 is active');
      }
    },
    {
      name: 'Verify Step 1 has Full Name field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dr-name'));
        const ph = await el.getAttribute('placeholder');
        if (!ph.includes('Dr.')) throw new Error(`Placeholder: "${ph}"`);
        console.log(`  Name placeholder: "${ph}"`);
      }
    },
    {
      name: 'Verify Step 1 has Email field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dr-email'));
        const type = await el.getAttribute('type');
        if (type !== 'email') throw new Error(`Type: ${type}`);
        console.log('  Doctor email field found');
      }
    },
    {
      name: 'Verify Step 1 has Phone field with maxlength=10',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dr-phone'));
        const max = await el.getAttribute('maxlength');
        if (max !== '10') throw new Error(`Maxlength: ${max}`);
        console.log('  Phone maxlength=10');
      }
    },
    {
      name: 'Verify Step 1 has Password and Confirm fields',
      fn: async (driver, config) => {
        const pw = await driver.findElement(By.id('dr-password'));
        const cf = await driver.findElement(By.id('dr-confirm'));
        if (!pw || !cf) throw new Error('Missing pw/confirm fields');
        console.log('  Password + Confirm fields present');
      }
    },
    {
      name: 'Verify Step 1 has "Next" button',
      fn: async (driver, config) => {
        const btns = await driver.findElements(By.css('#dr-step-1 .btn-primary'));
        let found = false;
        for (const b of btns) {
          const text = await b.getAttribute('textContent');
          if (text.includes('Next')) { found = true; break; }
        }
        if (!found) throw new Error('No Next button in step 1');
        console.log('  Step 1 Next button found');
      }
    },
    {
      name: 'Verify Step 2 has License Number field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dr-license'));
        const ph = await el.getAttribute('placeholder');
        if (!ph.includes('license')) throw new Error(`Placeholder: "${ph}"`);
        console.log(`  License placeholder: "${ph}"`);
      }
    },
    {
      name: 'Verify Step 2 has Specialization dropdown with options',
      fn: async (driver, config) => {
        const select = await driver.findElement(By.id('dr-spec'));
        const options = await select.findElements(By.css('option'));
        if (options.length < 5) throw new Error(`Only ${options.length} options`);
        console.log(`  ${options.length} specialization options`);
      }
    },
    {
      name: 'Verify Step 2 has Years of Experience field',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dr-exp'));
        const type = await el.getAttribute('type');
        if (type !== 'number') throw new Error(`Type: ${type}`);
        console.log('  Experience field (type=number)');
      }
    },
    {
      name: 'Verify Step 2 has Bio textarea',
      fn: async (driver, config) => {
        const el = await driver.findElement(By.id('dr-bio'));
        const tag = await el.getTagName();
        if (tag.toLowerCase() !== 'textarea') throw new Error(`Tag: ${tag}`);
        console.log('  Bio textarea found');
      }
    },
    {
      name: 'Verify Step 3 has "Join Existing Hospital" and "Create New Hospital" toggles',
      fn: async (driver, config) => {
        const joinBtn = await driver.findElement(By.id('hosp-join-btn'));
        const newBtn = await driver.findElement(By.id('hosp-new-btn'));
        const joinText = await joinBtn.getAttribute('textContent');
        const newText = await newBtn.getAttribute('textContent');
        if (!joinText.includes('Join') || !newText.includes('Create')) {
          throw new Error(`Join: "${joinText}", New: "${newText}"`);
        }
        console.log('  Hospital join/create toggles present');
      }
    }
  ]
};
