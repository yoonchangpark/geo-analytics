import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled'
        ]
    });
    const page = await browser.newPage();
    
    // Do NOT set UserAgent manually to preserve Stealth plugin's fingerprint matching
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto('https://smartstore.naver.com/wechik', { waitUntil: 'domcontentloaded', timeout: 8000 });
    
    await new Promise(r => setTimeout(r, 2000));
    const title = await page.title();
    console.log("Title: ", title);
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Text preview: ", text.substring(0, 100));
    
    await browser.close();
}
check();
