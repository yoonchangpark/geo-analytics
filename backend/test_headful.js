import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-position=-32000,-32000']
    });
    const page = await browser.newPage();
    
    await page.goto('https://smartstore.naver.com/wechik', { waitUntil: 'domcontentloaded', timeout: 8000 });
    
    await new Promise(r => setTimeout(r, 2000));
    const title = await page.title();
    console.log("Headless False Title: ", title);
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Text preview: ", text.substring(0, 50).replace(/\n/g, " "));
    
    await browser.close();
}
check();
