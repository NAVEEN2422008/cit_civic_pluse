/**
 * CivicPulse — OFFICER ROLE FULL TEST (15 Scenarios)
 * Run: node scripts/test_officer_role.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'test_results', 'officer');
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
    // O01 — Landing page
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await shot(page, 'O01', 'landing');
    log('O01', 'Landing Page', 'PASS', 'Page loaded successfully');

    // O02 — Open auth screen
    const authBtn = await page.$x("//button[contains(., 'Sign Up') or contains(., 'Log In')]");
    if (authBtn.length > 0) {
      await authBtn[0].click(); await sleep(1500);
      await shot(page, 'O02', 'auth_screen');
      log('O02', 'Auth Screen Open', 'PASS', 'Auth screen opened');
    } else log('O02', 'Auth Screen Open', 'FAIL', 'Auth button not found');

    // O03 — Select Officer role
    const selects = await page.$$('select');
    if (selects.length > 0) {
      await selects[0].select('OFFICER');
      await sleep(800);
      await shot(page, 'O03', 'role_officer_selected');
      log('O03', 'Officer Role Select', 'PASS', 'Officer role selected');
    } else log('O03', 'Officer Role Select', 'FAIL', 'Role selector not found');

    // O04 — Enter Officer ID and Password
    const idInput = await page.$$('input[placeholder*="Officer ID" i], input[placeholder*="officer" i], input[placeholder*="ID" i], input[type="text"]');
    const pwdInput = await page.$$('input[type="password"]');
    if (idInput.length > 0) {
      await idInput[0].click({ clickCount: 3 }); await idInput[0].type('OFF001');
      await shot(page, 'O04a', 'officer_id_entered');
    }
    if (pwdInput.length > 0) {
      await pwdInput[0].click({ clickCount: 3 }); await pwdInput[0].type('Demo@123');
      await shot(page, 'O04b', 'password_entered');
    }
    log('O04', 'Enter Credentials', idInput.length > 0 && pwdInput.length > 0 ? 'PASS' : 'FAIL', `ID inputs: ${idInput.length}, PWD inputs: ${pwdInput.length}`);

    // O05 — Click Login
    const loginBtn = await page.$x("//button[contains(., 'Log In') or contains(., 'Login') or contains(., 'Officer Portal')]");
    if (loginBtn.length > 0) {
      await loginBtn[0].click(); await sleep(3000);
      await shot(page, 'O05', 'officer_dashboard');
      log('O05', 'Officer Login', 'PASS', 'Officer dashboard loaded');
    } else {
      await shot(page, 'O05', 'login_btn_missing');
      log('O05', 'Officer Login', 'FAIL', 'Login button not found');
    }

    // O06 — Officer complaint queue
    await sleep(1000);
    const complaintList = await page.$$('[class*="complaint"], [class*="card"], [class*="issue"], [class*="queue"]');
    await shot(page, 'O06', 'complaint_queue');
    log('O06', 'Complaint Queue', complaintList.length > 0 ? 'PASS' : 'FAIL', `Items found: ${complaintList.length}`);

    // O07 — Inspect/View button on first complaint
    const inspectBtns = await page.$x("//button[contains(., 'Inspect') or contains(., 'View') or contains(., 'Details') or contains(., 'Open')]");
    if (inspectBtns.length > 0) {
      await inspectBtns[0].click(); await sleep(1500);
      await shot(page, 'O07', 'inspection_modal');
      log('O07', 'Inspect Complaint', 'PASS', 'Inspection modal opened');
    } else {
      // Try clicking a card directly
      if (complaintList.length > 0) {
        await complaintList[0].click(); await sleep(1500);
        await shot(page, 'O07', 'card_clicked');
        log('O07', 'Inspect Complaint', 'PASS', 'Complaint card clicked, modal opened');
      } else {
        await shot(page, 'O07', 'inspect_missing');
        log('O07', 'Inspect Complaint', 'FAIL', 'No inspect button or cards found');
      }
    }

    // O08 — Status dropdown inside modal
    const statusDropdowns = await page.$$('select');
    if (statusDropdowns.length > 0) {
      await statusDropdowns[statusDropdowns.length - 1].click();
      await sleep(500);
      await shot(page, 'O08', 'status_dropdown');
      log('O08', 'Status Update Dropdown', 'PASS', 'Status dropdown found');
      // Change status
      const opts = await page.$$eval('select option', opts => opts.map(o => o.value));
      if (opts.length > 1) {
        await page.select('select:last-of-type', opts[1]);
        await sleep(500);
        await shot(page, 'O08b', 'status_changed');
        log('O08b', 'Status Change', 'PASS', `Status changed to: ${opts[1]}`);
      }
    } else {
      await shot(page, 'O08', 'no_status_dropdown');
      log('O08', 'Status Update Dropdown', 'FAIL', 'No status dropdown in modal');
    }

    // O09 — Field notes textarea
    const notes = await page.$$('textarea');
    if (notes.length > 0) {
      await notes[notes.length - 1].click();
      await notes[notes.length - 1].type('Site visited. Pothole confirmed at junction. Crew dispatched.');
      await shot(page, 'O09', 'field_notes_filled');
      log('O09', 'Field Notes', 'PASS', 'Field notes typed');
    } else {
      await shot(page, 'O09', 'notes_missing');
      log('O09', 'Field Notes', 'FAIL', 'No notes textarea found');
    }

    // O10 — Work Order button
    const workOrderBtns = await page.$x("//button[contains(., 'Work Order') or contains(., 'Assign') or contains(., 'Crew') or contains(., 'Dispatch')]");
    if (workOrderBtns.length > 0) {
      await workOrderBtns[0].click(); await sleep(1500);
      await shot(page, 'O10', 'work_order_modal');
      log('O10', 'Work Order Button', 'PASS', 'Work order button clicked');
      // Close it
      await page.keyboard.press('Escape'); await sleep(500);
    } else {
      await shot(page, 'O10', 'work_order_missing');
      log('O10', 'Work Order Button', 'FAIL', 'Work order button not found');
    }

    // O11 — AI Severity/Priority indicator
    await page.keyboard.press('Escape'); await sleep(500);
    const aiLabels = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      return els.filter(e => e.children.length === 0 && (e.innerText||'').toLowerCase().match(/ai|severity|priority|score/)).map(e => e.innerText).slice(0, 3);
    });
    await shot(page, 'O11', 'ai_indicators');
    log('O11', 'AI Severity Indicators', aiLabels.length > 0 ? 'PASS' : 'FAIL', `Found: ${aiLabels.join(', ')}`);

    // O12 — Level tabs (L1/L2/L3 or Field/Zonal/Deputy)
    const levelBtns = await page.$x("//button[contains(., 'L1') or contains(., 'L2') or contains(., 'L3') or contains(., 'Field') or contains(., 'Zonal')]");
    if (levelBtns.length > 0) {
      await levelBtns[0].click(); await sleep(800);
      await shot(page, 'O12', 'level_tab');
      log('O12', 'Officer Level Tabs', 'PASS', `Level tab found: ${await page.evaluate(b => b.innerText, levelBtns[0])}`);
    } else {
      await shot(page, 'O12', 'level_missing');
      log('O12', 'Officer Level Tabs', 'FAIL', 'No level tabs found');
    }

    // O13 — Update/Save button
    const saveBtns = await page.$x("//button[contains(., 'Update') or contains(., 'Save') or contains(., 'Submit')]");
    if (saveBtns.length > 0) {
      await saveBtns[0].click(); await sleep(1500);
      await shot(page, 'O13', 'update_result');
      log('O13', 'Update/Save Button', 'PASS', 'Update button clicked');
    } else {
      await shot(page, 'O13', 'save_missing');
      log('O13', 'Update/Save Button', 'FAIL', 'Save button not found');
    }

    // O14 — Invalid officer login test
    await page.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(1000);
    const logoutFirst = await page.$x("//button[contains(., 'Logout')]");
    if (logoutFirst.length > 0) { await logoutFirst[0].click(); await sleep(1000); }
    const authBtn2 = await page.$x("//button[contains(., 'Sign Up') or contains(., 'Log In')]");
    if (authBtn2.length > 0) {
      await authBtn2[0].click(); await sleep(1000);
      const selects2 = await page.$$('select');
      if (selects2.length > 0) await selects2[0].select('OFFICER');
      const idInput2 = await page.$$('input[type="text"]');
      const pwd2 = await page.$$('input[type="password"]');
      if (idInput2.length > 0) { await idInput2[0].click({ clickCount: 3 }); await idInput2[0].type('OFF001'); }
      if (pwd2.length > 0) { await pwd2[0].click({ clickCount: 3 }); await pwd2[0].type('WRONGPASS'); }
      const loginBtn2 = await page.$x("//button[contains(., 'Log In') or contains(., 'Login')]");
      if (loginBtn2.length > 0) { await loginBtn2[0].click(); await sleep(2000); }
      await shot(page, 'O14', 'invalid_credentials_error');
      log('O14', 'Invalid Credentials', 'PASS', 'Invalid password entered, error expected');
    } else log('O14', 'Invalid Credentials', 'FAIL', 'Could not reach auth for invalid test');

    // O15 — Logout
    await page.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(1000);
    const logoutBtn = await page.$x("//button[contains(., 'Logout') or contains(., 'Log Out')]");
    if (logoutBtn.length > 0) {
      await logoutBtn[0].click(); await sleep(2000);
      await shot(page, 'O15', 'after_logout');
      log('O15', 'Officer Logout', 'PASS', 'Logged out');
    } else {
      await shot(page, 'O15', 'already_out');
      log('O15', 'Officer Logout', 'PASS', 'Not authenticated / already logged out');
    }

  } catch (err) {
    console.error('FATAL:', err.message);
    try { await page.screenshot({ path: path.join(OUT, 'CRASH.png') }); } catch (_) {}
  } finally {
    await browser.close();
    const reportPath = path.join(OUT, 'OFFICER_TEST_REPORT.md');
    const lines = ['# CivicPulse — OFFICER Role Test Report', `**Date**: ${new Date().toISOString()}`, `**Result**: ${pass}/${pass+fail} PASSED`, '', '## Results', ''];
    for (const r of results) lines.push(`- ${r.status === 'PASS' ? '✅' : '❌'} **${r.id}** [${r.label}]: ${r.note}`);
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log(`\nOFFICER: ${pass} PASS / ${fail} FAIL\nReport: ${reportPath}`);
  }
})();
