import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// 봇 탐지 우회 플러그인 장착
puppeteer.use(StealthPlugin());

export async function crawlPerplexity(keyword) {
    let browser;
    try {
        console.log(`[Real Crawler] Launching Stealth Browser for keyword: ${keyword}`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('[Real Crawler] Navigating to Perplexity.ai');
        // 사이트 진입 시 DOM 로드 대기
        await page.goto('https://www.perplexity.ai/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // 검색 텍스트 영역 대기 (Perplexity UI 기준)
        const searchBoxSelector = 'textarea';
        await page.waitForSelector(searchBoxSelector, { timeout: 10000 });
        console.log('[Real Crawler] Typing query...');
        
        await page.type(searchBoxSelector, `${keyword} 브랜드 추천해줘.`);
        await page.keyboard.press('Enter');

        // 답변이 스트리밍 되는 컨테이너 대기 (클래스는 수시로 변경될 수 있으므로 일반적인 prose 사용)
        const answerSelector = '.prose'; 
        console.log('[Real Crawler] Waiting for the answer stream...');
        await page.waitForSelector(answerSelector, { timeout: 20000 });
        
        // 스트리밍이 어느 정도 완료되도록 고정 시간 추가 대기
        await new Promise(r => setTimeout(r, 6000));
        
        const answerText = await page.evaluate(() => {
            const el = document.querySelector('.prose');
            return el ? el.innerText : '';
        });

        await browser.close();
        
        if (answerText.trim().length > 20) {
            console.log('[Real Crawler] Crawling successful. Extracted characters:', answerText.length);
            return answerText;
        } else {
            throw new Error("Extracted empty or excessively short answer.");
        }
    } catch (error) {
        console.error('[Real Crawler Error]', error.message);
        if (browser) await browser.close();
        throw error; 
    }
}
