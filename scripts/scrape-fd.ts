import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to https://fd.octaraa.com/login...');
    await page.goto('https://fd.octaraa.com/login', { waitUntil: 'networkidle2' });
    
    console.log('Finding phone input...');
    try {
      await page.waitForSelector('input', { timeout: 15000 });
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} inputs on the page.`);
    } catch (e) {
      console.log('Timeout waiting for any input. Dumping debug info...');
      fs.writeFileSync('debug.html', await page.content());
      await page.screenshot({ path: 'debug.png' });
      throw e;
    }
    const phoneInput = await page.$('input[type="tel"]') || await page.$('input[id="noCopyPaste"]') || await page.$('input[type="number"]') || await page.$('input[placeholder*="obile"]') || await page.$('input');
    
    if (!phoneInput) {
      throw new Error('Could not find phone input');
    }
    
    await phoneInput.type('7906077665', { delay: 100 });
    
    console.log('Clicking Get Started...');
    const btnClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const getStartedBtn = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('get started'));
      if (getStartedBtn) {
        getStartedBtn.click();
        return true;
      }
      return false;
    });
    
    if (!btnClicked) {
        // Try clicking any button that has continue, login, etc
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const getStartedBtn = btns.find(b => b.textContent && (b.textContent.toLowerCase().includes('continue') || b.textContent.toLowerCase().includes('login')));
            if (getStartedBtn) getStartedBtn.click();
        });
    }
    
    console.log('Waiting for OTP inputs to appear...');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('>>> READY_FOR_OTP <<<');
    console.log('Waiting for otp.txt to be created with the OTP...');
    
    const otpFile = path.join(process.cwd(), 'otp.txt');
    let otp = '';
    while (true) {
      if (fs.existsSync(otpFile)) {
        otp = fs.readFileSync(otpFile, 'utf8').trim();
        if (otp.length >= 4) {
          console.log(`Found OTP: ${otp}`);
          break;
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Enter OTP
    console.log('Entering OTP...');
    
    // For React/Next.js inputs, sometimes native property setters are required
    const inputs = await page.$$('input[type="tel"], input[type="number"], input[autocomplete="one-time-code"]');
    if (inputs.length >= 4 && inputs.length <= 6) {
        for (let i = 0; i < inputs.length; i++) {
            if (otpStr[i]) {
                await inputs[i].type(otpStr[i], { delay: 100 });
            }
        }
    } else if (inputs.length > 0) {
        await inputs[0].type(otpStr, { delay: 100 });
    }

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const verifyBtn = btns.find(b => b.textContent && (b.textContent.toLowerCase().includes('verify') || b.textContent.toLowerCase().includes('continue') || b.textContent.toLowerCase().includes('submit') || b.textContent.toLowerCase().includes('login')));
        if (verifyBtn) verifyBtn.click();
    });
    
    console.log('Waiting for login to complete and navigate to dashboard...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
      console.log('Navigation wait timed out, continuing anyway. We might be on an SPA.');
      await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log('Navigating to https://fd.octaraa.com/home/active...');
    await page.goto('https://fd.octaraa.com/home/active', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000)); // wait for api to load
    
    console.log('Extracting active FDs...');
    const pageText = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    fs.writeFileSync('scraped-fds.txt', pageText);
    console.log('Successfully saved to scraped-fds.txt');
    
  } catch (error) {
    console.error('Scraping error:', error);
  } finally {
    await browser.close();
  }
}

run();
