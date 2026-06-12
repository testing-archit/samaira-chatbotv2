import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://octaraa.com';

async function scrapeOctaraa() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  
  const visited = new Set<string>();
  const queue: string[] = [BASE_URL];
  const allChunks: string[] = [];
  
  while (queue.length > 0) {
    let currentUrl = queue.shift()!;
    // Normalize URL (remove trailing slash, hash, or query params)
    currentUrl = currentUrl.split('#')[0].split('?')[0].replace(/\/$/, '');
    
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    
    console.log(`[${visited.size}] Navigating to ${currentUrl}...`);
    
    const page = await browser.newPage();
    try {
      await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000)); // Wait for JS rendering
      
      const pageData = await page.evaluate((url) => {
        const chunks: string[] = [];
        let currentHeading = '';
        let currentText = '';

        // Walk the DOM tree and collect text from leaf nodes or nodes with direct text
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
           const text = node.nodeValue?.trim() || '';
           if (!text || text.length < 3) continue;
           
           // Check parent tag
           const parentName = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
           if (parentName === 'script' || parentName === 'style' || parentName === 'noscript') continue;

           if (['h1', 'h2', 'h3', 'h4', 'h5'].includes(parentName)) {
             if (currentHeading && currentText.length > 10) {
                chunks.push(`## [${url}] ${currentHeading}\n${currentText.trim()}`);
             }
             currentHeading = text;
             currentText = '';
           } else {
             currentText += text + '\n';
           }
        }
        
        if (currentHeading && currentText.length > 10) {
          chunks.push(`## [${url}] ${currentHeading}\n${currentText.trim()}`);
        }
        if (chunks.length === 0 && currentText.length > 10) {
          chunks.push(`## [${url}] Page Content\n${currentText.trim()}`);
        }
        
        // Extract links
        const links: string[] = [];
        document.querySelectorAll('a[href]').forEach(a => {
          if ((a as HTMLAnchorElement).href) links.push((a as HTMLAnchorElement).href);
        });

        return { chunks, links };
      }, currentUrl);
      
      const validChunks = pageData.chunks.filter(chunk => chunk.length > 50);
      allChunks.push(...validChunks);
      console.log(`  -> Extracted ${validChunks.length} chunks.`);
      
      for (let href of pageData.links) {
        href = href.split('#')[0].split('?')[0].replace(/\/$/, '');
        if (href.startsWith(BASE_URL) && !visited.has(href) && !queue.includes(href)) {
          // Avoid scraping static assets or weird endpoints if possible
          if (!href.match(/\.(pdf|jpg|jpeg|png|svg|gif)$/i)) {
             queue.push(href);
          }
        }
      }
      
    } catch (e) {
      console.error(`Failed to scrape ${currentUrl}:`, (e as Error).message);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\nCrawling complete. Visited ${visited.size} pages.`);
  console.log(`Extracted a total of ${allChunks.length} chunks of content.`);

  const outputPath = path.join(__dirname, '../octaraa-kb-seed.md');
  const markdown = allChunks.join('\n\n');
  
  // Overwrite the file with comprehensive content
  fs.writeFileSync(outputPath, markdown);
  console.log(`Successfully wrote comprehensive scraped content to ${outputPath}`);
}

scrapeOctaraa().catch(console.error);
