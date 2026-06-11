import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function scrapeOctaraa() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to https://octaraa.com...');
  await page.goto('https://octaraa.com', { waitUntil: 'networkidle2' });

  // Wait a little extra time for any client-side JS (like accordions) to fully render
  await new Promise(r => setTimeout(r, 3000));

  console.log('Extracting content...');
  // We will extract all headings (h2, h3, h4) and their subsequent text
  const extractedChunks = await page.evaluate(() => {
    const chunks: string[] = [];
    const elements = document.querySelectorAll('h1, h2, h3, h4, p, li, button, [role="button"]');
    
    let currentHeading = '';
    let currentText = '';

    elements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent?.trim() || '';

      if (!text) return;

      if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
        if (currentHeading && currentText) {
          chunks.push(`## ${currentHeading}\n${currentText}`);
        }
        currentHeading = text;
        currentText = '';
      } else {
        currentText += text + '\n';
      }
    });

    if (currentHeading && currentText) {
      chunks.push(`## ${currentHeading}\n${currentText}`);
    }

    return chunks;
  });

  await browser.close();

  // Filter out noisy short chunks (like nav links)
  const validChunks = extractedChunks.filter(chunk => chunk.length > 50);

  console.log(`Extracted ${validChunks.length} chunks of content.`);

  const outputPath = path.join(__dirname, '../octaraa-kb-seed.md');
  const markdown = validChunks.join('\n\n');
  
  fs.appendFileSync(outputPath, '\n\n' + markdown);
  console.log(`Successfully appended scraped content to ${outputPath}`);
}

scrapeOctaraa().catch(console.error);
