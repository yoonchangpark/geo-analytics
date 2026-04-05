import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://search.naver.com/search.naver?query=' + encodeURIComponent('다우니 공식 홈페이지'));
    
    const urls = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => a.href)
            .filter(h => h && h.startsWith('http') && !h.includes('naver.com') && !h.includes('pstatic.net') && !h.includes('ad.'))
            .slice(0, 5);
    });
    console.log("Filtered anchors Naver:", urls);
    
    await browser.close();
}

check();
