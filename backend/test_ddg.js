import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://html.duckduckgo.com/html/?q=' + encodeURIComponent('크리넥스 네이버 스마트스토어'));
    
    const urls = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('.result__url'));
        return anchors.map(a => a.href.trim());
    });
    console.log("Filtered anchors:", urls.slice(0, 5));
    
    await browser.close();
}

check();
