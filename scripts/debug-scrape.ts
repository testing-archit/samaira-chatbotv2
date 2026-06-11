import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  await page.goto('https://octaraa.com', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('a')).find(el => el.innerText.includes('FAQ'));
    if (a) a.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  // Expand all accordions
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, [role="button"], .accordion, [data-state]');
    buttons.forEach((btn: any) => {
      try { btn.click(); } catch (e) {}
    });
  });

  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 3000));
  await browser.close();
}

main();
