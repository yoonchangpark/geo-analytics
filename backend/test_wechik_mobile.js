import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();
    
    // Mobile Chrome User Agent
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    
    // Change URL to mobile domain
    await page.goto('https://m.smartstore.naver.com/wechik', { waitUntil: 'domcontentloaded', timeout: 8000 });
    
    await new Promise(r => setTimeout(r, 2000));
    const title = await page.title();
    console.log("Mobile Title: ", title);
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Mobile Text preview: ", text.substring(0, 100).replace(/\n/g, " "));
    
    await browser.close();
}
check();
