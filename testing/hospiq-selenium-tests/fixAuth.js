const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/cnaid/Downloads/doc/htdocs/hospiq-selenium-tests/tests';

// 1. Update patient dashboard tests
const f1 = path.join(dir, 'patient-dashboard.test.js');
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/await driver\.get\(\`\$\{config\.baseUrl\}\/patient\.html\`\);/g, "await driver.get(config.baseUrl + '/'); await driver.executeScript(\"localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'patient'); localStorage.setItem('hospiq_name', 'Test Patient');\"); await driver.get(`${config.baseUrl}/patient.html`);");
c1 = c1.replace(/if \(!title\.includes\('HospiQ'\)\)/g, "if (!title.includes('Patient'))");
fs.writeFileSync(f1, c1);

// 2. Update doctor dashboard tests
const f2 = path.join(dir, 'doctor-dashboard.test.js');
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/await driver\.get\(\`\$\{config\.baseUrl\}\/doctor\.html\`\);/g, "await driver.get(config.baseUrl + '/'); await driver.executeScript(\"localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'doctor'); localStorage.setItem('hospiq_name', 'Dr. Test');\"); await driver.get(`${config.baseUrl}/doctor.html`);");
c2 = c2.replace(/if \(!title\.includes\('HospiQ'\)\)/g, "if (!title.includes('Doctor'))");
fs.writeFileSync(f2, c2);

// 3. Update navigation tests
const f3 = path.join(dir, 'navigation.test.js');
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/await driver\.get\(\`\$\{config\.baseUrl\}\/patient\.html\`\);/g, "await driver.get(config.baseUrl + '/'); await driver.executeScript(\"localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'patient');\"); await driver.get(`${config.baseUrl}/patient.html`);");
c3 = c3.replace(/await driver\.get\(\`\$\{config\.baseUrl\}\/doctor\.html\`\);/g, "await driver.get(config.baseUrl + '/'); await driver.executeScript(\"localStorage.setItem('hospiq_token', 'dummy'); localStorage.setItem('hospiq_role', 'doctor');\"); await driver.get(`${config.baseUrl}/doctor.html`);");
fs.writeFileSync(f3, c3);

console.log('Injected localStorage auth for dashboard live tests');
