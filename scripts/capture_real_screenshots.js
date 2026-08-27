import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Naveen S\\.gemini\\antigravity-ide\\brain\\a8a2f493-2853-4a03-9c9c-5ee2b1372064';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runScreenshotCapture() {
  console.log('🚀 Launching Local Edge Browser for Manual UI Testing & Screenshot Capture...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // 1. HOME LANDING PAGE
    console.log('📸 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot_1_home_landing.png') });
    console.log('✓ Captured: screenshot_1_home_landing.png');

    // 2. STATE COMMAND & CONTROL CENTER (ADMIN DASHBOARD)
    console.log('📸 Testing State Command & Control Center...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.innerText.includes('Admin') || b.innerText.includes('Officer'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot_2_state_command_admin.png') });
    console.log('✓ Captured: screenshot_2_state_command_admin.png');

    // 3. 10 REAL-PERSON SCENARIOS SIMULATOR
    console.log('📸 Testing 10 Real-Person Scenario Simulator...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const scenarioBtn = btns.find(b => b.innerText.includes('10 Real-Person Scenarios'));
      if (scenarioBtn) scenarioBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot_3_real_person_scenarios.png') });
    console.log('✓ Captured: screenshot_3_real_person_scenarios.png');

    // 4. MY CIVIC HUB & PROOF OF WORK
    console.log('📸 Testing My Civic Hub & Proof of Work...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const hubBtn = btns.find(b => b.innerText.includes('My Civic Hub') || b.innerText.includes('Hub'));
      if (hubBtn) hubBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot_4_my_civic_hub.png') });
    console.log('✓ Captured: screenshot_4_my_civic_hub.png');

    // 5. INTERACTIVE SATELLITE MAP
    console.log('📸 Testing Interactive Satellite Map View...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mapBtn = btns.find(b => b.innerText.includes('Map'));
      if (mapBtn) mapBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot_5_interactive_map.png') });
    console.log('✓ Captured: screenshot_5_interactive_map.png');

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    console.log('🎉 Manual UI Screenshot Capture Completed Successfully!');
  }
}

runScreenshotCapture();
