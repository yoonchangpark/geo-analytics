import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.goto('https://smartstore.naver.com/wechik', { waitUntil: 'domcontentloaded', timeout: 8000 });
    
    await new Promise(r => setTimeout(r, 2000));
    const title = await page.title();
    console.log("Title: ", title);
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Text preview: ", text.substring(0, 100));
    
    await page.screenshot({ path: "test_wechik.png" });
    await browser.close();
}
check();
