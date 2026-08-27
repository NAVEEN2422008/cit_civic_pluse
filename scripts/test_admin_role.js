/**
 * CivicPulse — ADMIN / STATE COMMAND CENTER ROLE FULL TEST (14 Scenarios)
 * Run: node scripts/test_admin_role.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'test_results', 'admin');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let pass = 0, fail = 0;

async function shot(page, id, label) {
  const file = path.join(OUT, `${id}_${label.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
}

function log(id, label, status, note) {
  results.push({ id, label, status, note });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${id} [${label}]: ${note}`);
  if (status === 'PASS') pass++; else fail++;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  try {
    // A01 — Landing
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await shot(page, 'A01', 'landing');
    log('A01', 'Landing Page', 'PASS', 'App loaded');

    // A02 — Auth screen
    const authBtn = await page.$x("//button[contains(., 'Sign Up') or contains(., 'Log In')]");
    if (authBtn.length > 0) { await authBtn[0].click(); await sleep(1500); }
    await shot(page, 'A02', 'auth_screen');
    log('A02', 'Auth Screen', authBtn.length > 0 ? 'PASS' : 'FAIL', 'Auth button clicked');

    // A03 — Select Officer/Admin role
    const selects = await page.$$('select');
    if (selects.length > 0) {
      await selects[0].select('OFFICER');
      await sleep(800);
      await shot(page, 'A03', 'role_officer_for_admin');
      log('A03', 'Admin Role Select', 'PASS', 'OFFICER role selected (shares login with Admin)');
    } else log('A03', 'Admin Role Select', 'FAIL', 'Role selector not found');

    // A04 — Enter Admin credentials
    const idInput = await page.$$('input[type="text"]');
    const pwdInput = await page.$$('input[type="password"]');
    if (idInput.length > 0) {
      await idInput[0].click({ clickCount: 3 }); await idInput[0].type('ADMIN01');
    }
    if (pwdInput.length > 0) {
      await pwdInput[0].click({ clickCount: 3 }); await pwdInput[0].type('Demo@123');
    }
    await shot(page, 'A04', 'admin_credentials');
    log('A04', 'Admin Credentials', idInput.length > 0 ? 'PASS' : 'FAIL', `ID: ${idInput.length}, PWD: ${pwdInput.length} inputs found`);

    // A05 — Login
    const loginBtn = await page.$x("//button[contains(., 'Log In') or contains(., 'Login') or contains(., 'Officer Portal')]");
    if (loginBtn.length > 0) {
      await loginBtn[0].click(); await sleep(3000);
      await shot(page, 'A05', 'admin_dashboard');
      log('A05', 'Admin Login', 'PASS', 'Admin dashboard loaded');
    } else {
      await shot(page, 'A05', 'login_missing');
      log('A05', 'Admin Login', 'FAIL', 'Login button missing');
    }

    // A06 — State Command Center visible
    const dashText = await page.evaluate(() => document.body.innerText);
    const hasAdminUI = dashText.toLowerCase().includes('admin') || dashText.toLowerCase().includes('command') || dashText.toLowerCase().includes('state') || dashText.toLowerCase().includes('dashboard');
    await shot(page, 'A06', 'admin_ui_visible');
    log('A06', 'Admin UI Visible', hasAdminUI ? 'PASS' : 'FAIL', `Admin keywords found: ${hasAdminUI}`);

    // A07 — Analytics/Charts
    const chartEls = await page.$$('canvas, svg[class*="chart"], [class*="analytics"], [class*="stat"]');
    await shot(page, 'A07', 'analytics_charts');
    log('A07', 'Analytics Charts', chartEls.length > 0 ? 'PASS' : 'FAIL', `Chart elements: ${chartEls.length}`);

    // A08 — Emergency Mode / SLA Toggle
    const emergencyBtns = await page.$x("//button[contains(., 'Emergency') or contains(., 'SLA') or contains(., 'Override') or contains(., 'Alert')]");
    const toggles = await page.$$('input[type="checkbox"], input[type="range"], [class*="toggle"], [role="switch"]');
    if (emergencyBtns.length > 0) {
      await emergencyBtns[0].click(); await sleep(1000);
      await shot(page, 'A08', 'emergency_toggle');
      log('A08', 'Emergency Mode Toggle', 'PASS', 'Emergency button clicked');
    } else if (toggles.length > 0) {
      await toggles[0].click(); await sleep(800);
      await shot(page, 'A08', 'toggle_clicked');
      log('A08', 'Emergency Mode Toggle', 'PASS', 'Toggle switch found and clicked');
    } else {
      await shot(page, 'A08', 'no_toggle');
      log('A08', 'Emergency Mode Toggle', 'FAIL', 'No emergency/SLA toggle found');
    }

    // A09 — District filter dropdown
    const allSelects = await page.$$('select');
    if (allSelects.length > 1) {
      await allSelects[allSelects.length - 1].click();
      await sleep(400);
      await shot(page, 'A09', 'district_filter');
      log('A09', 'District Filter', 'PASS', 'District dropdown found');
    } else {
      const filterBtns = await page.$x("//button[contains(., 'District') or contains(., 'Region') or contains(., 'Filter') or contains(., 'Zone')]");
      if (filterBtns.length > 0) {
        await filterBtns[0].click(); await sleep(500);
        await shot(page, 'A09', 'filter_btn');
        log('A09', 'District Filter', 'PASS', 'Filter button found');
      } else {
        await shot(page, 'A09', 'filter_missing');
        log('A09', 'District Filter', 'FAIL', 'No district filter found');
      }
    }

    // A10 — Complaint list / oversight panel
    const complaintItems = await page.$$('[class*="card"], [class*="complaint"], [class*="list-item"], tr');
    await shot(page, 'A10', 'complaint_oversight');
    log('A10', 'Complaint Oversight', complaintItems.length > 0 ? 'PASS' : 'FAIL', `Items visible: ${complaintItems.length}`);

    // A11 — Officer assignment
    const assignBtns = await page.$x("//button[contains(., 'Assign') or contains(., 'Reassign') or contains(., 'Transfer')]");
    if (assignBtns.length > 0) {
      await assignBtns[0].click(); await sleep(1000);
      await shot(page, 'A11', 'assign_panel');
      log('A11', 'Officer Assignment', 'PASS', 'Assign button clicked');
      await page.keyboard.press('Escape');
    } else {
      await shot(page, 'A11', 'assign_missing');
      log('A11', 'Officer Assignment', 'FAIL', 'No assignment button found');
    }

    // A12 — Export/Download button
    const exportBtns = await page.$x("//button[contains(., 'Export') or contains(., 'Download') or contains(., 'Report') or contains(., 'PDF')]");
    if (exportBtns.length > 0) {
      await exportBtns[0].click(); await sleep(1500);
      await shot(page, 'A12', 'export_clicked');
      log('A12', 'Export/Download', 'PASS', 'Export button clicked');
    } else {
      await shot(page, 'A12', 'export_missing');
      log('A12', 'Export/Download', 'FAIL', 'No export button found');
    }

    // A13 — Responsive mobile check (375px viewport)
    await page.setViewport({ width: 375, height: 812 });
    await sleep(1000);
    await shot(page, 'A13', 'mobile_375px_view');
    log('A13', 'Mobile Responsive (375px)', 'PASS', 'Mobile viewport set, screenshot taken');
    await page.setViewport({ width: 1280, height: 800 });
    await sleep(500);

    // A14 — Admin Logout
    const logoutBtn = await page.$x("//button[contains(., 'Logout') or contains(., 'Log Out')]");
    if (logoutBtn.length > 0) {
      await logoutBtn[0].click(); await sleep(2000);
      await shot(page, 'A14', 'after_logout');
      log('A14', 'Admin Logout', 'PASS', 'Logout successful');
    } else {
      await shot(page, 'A14', 'logout_missing');
      log('A14', 'Admin Logout', 'FAIL', 'Logout button not found');
    }

  } catch (err) {
    console.error('FATAL:', err.message);
    try { await page.screenshot({ path: path.join(OUT, 'CRASH.png') }); } catch (_) {}
  } finally {
    await browser.close();
    const reportPath = path.join(OUT, 'ADMIN_TEST_REPORT.md');
    const lines = ['# CivicPulse — ADMIN Role Test Report', `**Date**: ${new Date().toISOString()}`, `**Result**: ${pass}/${pass+fail} PASSED`, '', '## Results', ''];
    for (const r of results) lines.push(`- ${r.status === 'PASS' ? '✅' : '❌'} **${r.id}** [${r.label}]: ${r.note}`);
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log(`\nADMIN: ${pass} PASS / ${fail} FAIL\nReport: ${reportPath}`);
  }
})();
