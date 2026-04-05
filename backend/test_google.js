import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://www.google.com/search?q=' + encodeURIComponent('크리넥스 공식 홈페이지'));
    const html = await page.content();
    console.log(html.substring(0, 1000));
    console.log('Contains #search:', html.includes('id="search"'));
    
    const urls = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => a.href).filter(h => h && h.startsWith('http') && !h.includes('google.com'));
    });
    console.log("Filtered anchors:", urls.slice(0, 5));
    
    await browser.close();
}

check();
