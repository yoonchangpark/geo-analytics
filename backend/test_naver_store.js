import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

async function check() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://brand.naver.com/pg', { waitUntil: 'domcontentloaded', timeout: 8000 });
    
    // Wait for text
    await new Promise(r => setTimeout(r, 2000));
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Text output:");
    console.log(text.substring(0, 500));
    
    await browser.close();
}

check();
