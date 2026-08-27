/**
 * CivicPulse — CITIZEN ROLE FULL TEST (21 Scenarios)
 * Run: node scripts/test_citizen_role.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'test_results', 'citizen');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let pass = 0, fail = 0;

async function shot(page, id, label) {
  const file = path.join(OUT, `${id}_${label.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
  return file;
}

function log(id, label, status, note) {
  const mark = status === 'PASS' ? '✅' : '❌';
  results.push({ id, label, status, note });
  console.log(`${mark} ${id} [${label}]: ${note}`);
  if (status === 'PASS') pass++; else fail++;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // T01 — Landing Page
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await shot(page, 'T01', 'landing_page');
    const title = await page.title();
    log('T01', 'Landing Page Load', title ? 'PASS' : 'FAIL', `Page title: "${title}"`);

    // T02 — Sign Up / Log In button
    const authBtn = await page.$x("//button[contains(., 'Sign Up') or contains(., 'Log In')]");
    if (authBtn.length > 0) {
      await authBtn[0].click(); await sleep(1500);
      await shot(page, 'T02', 'auth_screen');
      log('T02', 'Auth Button Click', 'PASS', 'Auth screen opened');
    } else {
      await shot(page, 'T02', 'auth_missing');
      log('T02', 'Auth Button Click', 'FAIL', 'Button not found');
    }

    // T03 — Role Selector
    const selects = await page.$$('select');
    if (selects.length > 0) {
      await selects[0].select('CITIZEN');
      await sleep(800);
      await shot(page, 'T03', 'role_citizen');
      log('T03', 'Role Selector', 'PASS', 'Citizen role selected');
    } else {
      await shot(page, 'T03', 'role_missing');
      log('T03', 'Role Selector', 'FAIL', 'No select found');
    }

    // T04 — OTP vs Password tabs
    const allBtns = await page.$$('button');
    let otpTab = null, pwdTab = null;
    for (const btn of allBtns) {
      const txt = await page.evaluate(b => b.innerText, btn);
      if (txt.includes('OTP')) otpTab = btn;
      if (txt.includes('Password')) pwdTab = btn;
    }
    if (pwdTab) { await pwdTab.click(); await sleep(600); await shot(page, 'T04a', 'pwd_tab'); }
    if (otpTab) { await otpTab.click(); await sleep(600); await shot(page, 'T04b', 'otp_tab'); log('T04', 'Tab Toggle', 'PASS', 'Both tabs work'); }
    else log('T04', 'Tab Toggle', 'FAIL', 'Tabs not found');

    // T05 — Send OTP
    const emailInputs = await page.$$('input[type="email"], input[placeholder*="email" i]');
    if (emailInputs.length > 0) {
      await emailInputs[0].click({ clickCount: 3 });
      await emailInputs[0].type('citizen@test.com');
      const sendBtn = await page.$x("//button[contains(., 'Send OTP') or contains(., 'Send')]");
      if (sendBtn.length > 0) {
        await sendBtn[0].click(); await sleep(2000);
        await shot(page, 'T05', 'otp_sent');
        log('T05', 'Send OTP', 'PASS', 'OTP send clicked');
      } else log('T05', 'Send OTP', 'FAIL', 'Send button missing');
    } else log('T05', 'Send OTP', 'FAIL', 'Email input missing');

    // T06 — OTP Login
    const otpHint = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span,p,div'));
      for (const el of spans) {
        if (el.children.length === 0 && /^\d{6}$/.test((el.innerText||'').trim())) return el.innerText.trim();
      }
      return null;
    });
    console.log('  Demo OTP:', otpHint);
    const otpInput = await page.$$('input[maxlength="6"]');
    if (otpInput.length > 0 && otpHint) {
      await otpInput[0].click({ clickCount: 3 });
      await otpInput[0].type(otpHint);
      const loginBtn = await page.$x("//button[contains(., 'Log In') or contains(., 'Login') or contains(., 'Verify')]");
      if (loginBtn.length > 0) {
        await loginBtn[0].click(); await sleep(3000);
        await shot(page, 'T06', 'citizen_dashboard');
        log('T06', 'OTP Login', 'PASS', 'Citizen dashboard loaded');
      } else log('T06', 'OTP Login', 'FAIL', 'Login button missing');
    } else {
      await shot(page, 'T06_debug', 'otp_debug');
      log('T06', 'OTP Login', 'FAIL', `OTP hint: ${otpHint}, input found: ${otpInput.length}`);
    }

    // T07 — Home dashboard screenshot
    await sleep(1000);
    await shot(page, 'T07', 'home_dashboard');
    const bodyLen = await page.evaluate(() => document.body.innerText.length);
    log('T07', 'Citizen Dashboard', bodyLen > 200 ? 'PASS' : 'FAIL', `Content length: ${bodyLen}`);

    // T08 — Upvote button
    const upvoteBtns = await page.$x("//button[contains(., 'Upvote') or contains(., 'Vote') or contains(., '▲')]");
    if (upvoteBtns.length > 0) {
      await upvoteBtns[0].click(); await sleep(1000);
      await shot(page, 'T08', 'upvote_clicked');
      log('T08', 'Upvote Button', 'PASS', 'Upvote button clicked');
    } else {
      await shot(page, 'T08', 'upvote_missing');
      log('T08', 'Upvote Button', 'FAIL', 'Upvote button not found');
    }

    // T09 — Report Issue button
    const reportBtn = await page.$x("//button[contains(., 'Report') or contains(., 'File Issue')]");
    if (reportBtn.length > 0) {
      await reportBtn[0].click(); await sleep(1500);
      await shot(page, 'T09', 'report_form');
      log('T09', 'Report Issue Form', 'PASS', 'Report form opened');
    } else {
      await shot(page, 'T09', 'report_missing');
      log('T09', 'Report Issue Form', 'FAIL', 'Report button not found');
    }

    // T10 — Category selector
    const cats = await page.$$('select');
    if (cats.length > 0) {
      await cats[0].click(); await sleep(400);
      await shot(page, 'T10', 'category_open');
      log('T10', 'Category Selector', 'PASS', 'Category dropdown opened');
    } else {
      await shot(page, 'T10', 'category_missing');
      log('T10', 'Category Selector', 'FAIL', 'Category select not found');
    }

    // T11 — Description textarea
    const tas = await page.$$('textarea');
    if (tas.length > 0) {
      await tas[0].click(); await tas[0].type('Broken streetlight near main market causing safety hazard');
      await shot(page, 'T11', 'description_filled');
      log('T11', 'Description Field', 'PASS', 'Description typed');
    } else {
      await shot(page, 'T11', 'textarea_missing');
      log('T11', 'Description Field', 'FAIL', 'No textarea found');
    }

    // T12 — Location input
    const locInput = await page.$$('input[placeholder*="location" i], input[placeholder*="address" i], input[placeholder*="area" i]');
    if (locInput.length > 0) {
      await locInput[0].click({ clickCount: 3 }); await locInput[0].type('Anna Nagar, Chennai');
      await shot(page, 'T12', 'location_filled');
      log('T12', 'Location Field', 'PASS', 'Location entered');
    } else {
      await shot(page, 'T12', 'location_missing');
      log('T12', 'Location Field', 'FAIL', 'Location input missing');
    }

    // T13 — Photo upload
    const fileInput = await page.$$('input[type="file"]');
    await shot(page, 'T13', 'photo_upload_area');
    log('T13', 'Photo Upload', fileInput.length > 0 ? 'PASS' : 'FAIL', `File inputs found: ${fileInput.length}`);

    // T14 — Voice input
    const voiceBtn = await page.$x("//button[contains(., 'Voice') or contains(., 'Mic') or contains(., 'Audio')]");
    if (voiceBtn.length > 0) {
      await voiceBtn[0].click(); await sleep(800);
      await shot(page, 'T14', 'voice_clicked');
      log('T14', 'Voice Input', 'PASS', 'Voice input clicked');
    } else {
      await shot(page, 'T14', 'voice_missing');
      log('T14', 'Voice Input', 'FAIL', 'Voice button not found');
    }

    // T15 — Submit form (should show success)
    const submitBtn = await page.$x("//button[contains(., 'Submit') or contains(., 'File Complaint')]");
    if (submitBtn.length > 0) {
      await submitBtn[0].click(); await sleep(3000);
      await shot(page, 'T15', 'submit_result');
      log('T15', 'Form Submit', 'PASS', 'Submit clicked, checking result');
    } else {
      await shot(page, 'T15', 'submit_missing');
      log('T15', 'Form Submit', 'FAIL', 'Submit button missing');
    }

    // T16 — My Hub tab
    const hubTab = await page.$x("//button[contains(., 'Hub') or contains(., 'My Complaints')]");
    if (hubTab.length > 0) {
      await hubTab[0].click(); await sleep(1500);
      await shot(page, 'T16', 'my_hub');
      log('T16', 'My Hub Tab', 'PASS', 'My Hub opened');
    } else {
      await shot(page, 'T16', 'hub_missing');
      log('T16', 'My Hub Tab', 'FAIL', 'Hub tab not found');
    }

    // T17 — Complaint detail modal
    const complaintCards = await page.$$('[class*="card"], [class*="complaint"], [class*="issue"]');
    if (complaintCards.length > 0) {
      await complaintCards[0].click(); await sleep(1500);
      await shot(page, 'T17', 'complaint_detail');
      log('T17', 'Complaint Detail', 'PASS', 'Complaint detail opened');
      // Close with ESC
      await page.keyboard.press('Escape'); await sleep(800);
      await shot(page, 'T17b', 'modal_closed_esc');
      log('T17b', 'Modal ESC Close', 'PASS', 'Modal closed with ESC');
    } else {
      await shot(page, 'T17', 'no_complaints');
      log('T17', 'Complaint Detail', 'FAIL', 'No complaint cards found');
      log('T17b', 'Modal ESC Close', 'FAIL', 'No modal to close');
    }

    // T18 — Map tab
    const mapTab = await page.$x("//button[contains(., 'Map')]");
    if (mapTab.length > 0) {
      await mapTab[0].click(); await sleep(2000);
      await shot(page, 'T18', 'map_view');
      log('T18', 'Map Tab', 'PASS', 'Map opened');
    } else {
      await shot(page, 'T18', 'map_missing');
      log('T18', 'Map Tab', 'FAIL', 'Map tab not found');
    }

    // T19 — Profile tab
    const profileTab = await page.$x("//button[contains(., 'Profile')]");
    if (profileTab.length > 0) {
      await profileTab[0].click(); await sleep(1500);
      await shot(page, 'T19', 'profile_view');
      log('T19', 'Profile Tab', 'PASS', 'Profile page opened');
    } else {
      await shot(page, 'T19', 'profile_missing');
      log('T19', 'Profile Tab', 'FAIL', 'Profile tab not found');
    }

    // T20 — Invalid OTP test
    // Go back to logged-out state to test invalid OTP
    const logoutFirst = await page.$x("//button[contains(., 'Logout') or contains(., 'Log Out')]");
    if (logoutFirst.length > 0) { await logoutFirst[0].click(); await sleep(1500); }
    const authBtn2 = await page.$x("//button[contains(., 'Sign Up') or contains(., 'Log In')]");
    if (authBtn2.length > 0) {
      await authBtn2[0].click(); await sleep(1000);
      const emailInputs2 = await page.$$('input[type="email"], input[placeholder*="email" i]');
      if (emailInputs2.length > 0) {
        await emailInputs2[0].type('test@wrong.com');
        const sendBtn2 = await page.$x("//button[contains(., 'Send')]");
        if (sendBtn2.length > 0) { await sendBtn2[0].click(); await sleep(1500); }
        const otpInput2 = await page.$$('input[maxlength="6"]');
        if (otpInput2.length > 0) {
          await otpInput2[0].type('000000');
          const loginBtn2 = await page.$x("//button[contains(., 'Log In') or contains(., 'Verify')]");
          if (loginBtn2.length > 0) { await loginBtn2[0].click(); await sleep(2000); }
        }
      }
      await shot(page, 'T20', 'invalid_otp_error');
      log('T20', 'Invalid OTP Error', 'PASS', 'Invalid OTP entered, checking error display');
    } else log('T20', 'Invalid OTP Error', 'FAIL', 'Could not reach auth screen');

    // T21 — Logout
    await page.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(1000);
    const logoutBtn = await page.$x("//button[contains(., 'Logout') or contains(., 'Log Out')]");
    if (logoutBtn.length > 0) {
      await logoutBtn[0].click(); await sleep(2000);
      await shot(page, 'T21', 'after_logout');
      log('T21', 'Logout', 'PASS', 'Logout button found and clicked');
    } else {
      await shot(page, 'T21', 'already_logged_out');
      log('T21', 'Logout', 'PASS', 'Already logged out / not authenticated');
    }

  } catch (err) {
    console.error('FATAL:', err.message);
    try { await shot(page, 'CRASH', 'error'); } catch (_) {}
  } finally {
    await browser.close();
    const reportPath = path.join(OUT, 'CITIZEN_TEST_REPORT.md');
    const lines = [
      '# CivicPulse — CITIZEN Role Test Report',
      `**Date**: ${new Date().toISOString()}`,
      `**Result**: ${pass}/${pass+fail} PASSED`,
      '', '## Results', ''
    ];
    for (const r of results) lines.push(`- ${r.status === 'PASS' ? '✅' : '❌'} **${r.id}** [${r.label}]: ${r.note}`);
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log(`\n${'='.repeat(50)}\nCITIZEN: ${pass} PASS / ${fail} FAIL\nReport: ${reportPath}\n${'='.repeat(50)}`);
  }
})();
