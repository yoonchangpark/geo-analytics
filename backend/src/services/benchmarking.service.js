import { OpenAI } from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';


import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function scrapeWithProxyOrPuppeteer(url, brandKey) {
    if (!url) return { text: "URL 없음", screenshot: null };

    // 1. 프록시 API 모드 (Web SaaS 배포 환경용)
    if (process.env.SCRAPER_API_KEY) {
        try {
            console.log(`[Proxy Mode] Fetching via ScraperAPI: ${url}`);
            const proxyUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true&premium=true&country_code=kr`;
            const response = await axios.get(proxyUrl, { timeout: 60000 });
            const $ = cheerio.load(response.data);
            const text = $('body').text().replace(/\s+/g, ' ');
            
            const rawLength = text.length;
            const finalContent = rawLength > 50 ? text.substring(0, 3000) : "스크래핑 데이터가 너무 짧음 (차단 의심)";
            
            return { text: finalContent, screenshot: null, rawLength: rawLength };
        } catch (e) {
            console.error(`[Proxy Error] ScraperAPI failed for ${url}:`, e.message);
            // DO NOT return here, fallback to Puppeteer Mode below!
        }
    }

    // 2. 로컬 브라우저 모드 (데스크톱 및 개발 환경 Fallback - Puppeteer)
    let browser;
    try {
        console.log(`[Puppeteer Mode] Scraping local: ${url}`);
        
        // 1차 우회 시도: 순수 Axios로 HTML 구조만 빠르게 긁어오기 (일부 WAF는 브라우저 엔진보다 단순 HTTP GET을 더 선호함)
        try {
            const axiosHTML = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'max-age=0',
                    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"'
                },
                timeout: 8000
            });
            const $ = cheerio.load(axiosHTML.data);
            const textHTML = $('body').text().replace(/\s+/g, ' ');
            if (textHTML.length > 300 && !textHTML.includes('보안 확인') && !textHTML.includes('보안접속')) {
                console.log(`[Axios Bypassing Success] on ${url}`);
                // 단순 텍스트만 성공했을 경우 스크린샷은 없지만 분석엔 충분함
                return { text: textHTML.substring(0, 3000), screenshot: null, rawLength: textHTML.length };
            }
        } catch(axErr) {
            console.log(`[Axios Bypassing Failed] falling back to Puppeteer Stealth...`);
        }

        // 2차 우회 시도: 고급 Puppeteer Stealth 모드 + Residential Proxy
        const puppeteerArgs = [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-infobars'
        ];
        
        if (process.env.SCRAPER_API_KEY) {
            puppeteerArgs.push(`--proxy-server=http://proxy-server.scraperapi.com:8001`);
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: puppeteerArgs
        });
        const page = await browser.newPage();
        
        if (process.env.SCRAPER_API_KEY) {
            await page.authenticate({ username: 'scraperapi.residential=true', password: process.env.SCRAPER_API_KEY });
        }
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        // 치명적 WAF 블록(웹드라이버 감지) 회피를 위한 브라우저 핑거프린트 오버라이드
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        });
        
        await page.setViewport({ width: 1280, height: 1024 });
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // SPA (React/Vue) 및 지연 로딩(Lazy Load) 이미지/텍스트 강제 렌더링을 위한 자동 스크롤 로직
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                let distance = 300; // 한 번에 스크롤할 픽셀
                let timer = setInterval(() => {
                    let scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    // 최대 6000 픽셀까지만 스크롤 하거나 바닥에 닿으면 종료
                    if(totalHeight >= scrollHeight || totalHeight > 6000){
                        clearInterval(timer);
                        resolve();
                    }
                }, 400); // 400ms 마다 스크롤
            });
        });
        
        // 스크롤 완료 후 돔이 안정화 될 때까지 1.5초 추가 대기
        await new Promise(r => setTimeout(r, 1500));
        
        const screenshotDir = path.resolve('public', 'screenshots');
        if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
        
        const safeKey = brandKey ? brandKey.replace(/[^a-zA-Z0-9가-힣]/g, '_') : 'site';
        const filename = `${safeKey}_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotDir, filename);
        
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const screenshotUrl = `${backendUrl}/screenshots/${filename}`;

        const text = await page.evaluate(() => document.body.innerText);
        
        let cleanedText = text.replace(/\s+/g, ' ');
        let finalContent = "";
        let finalLength = cleanedText.length;
        
        // 네이버 WAF 및 방화벽 필터링 검출
        if (cleanedText.includes('현재 서비스 접속이 불가') || cleanedText.includes('Please complete the security verification') || cleanedText.includes('요청하신 페이지를 찾을 수 없습니다') || cleanedText.includes('Not Found') || cleanedText.length < 50) {
            
            // 3차 우회 시도 (서바이벌 모드): 대상 사이트에 들어가지 못하더라도, 네이버 지식스니펫/검색결과 미리보기 텍스트만이라도 스크래핑해서 넘김
            try {
                console.log(`[WAF Blocked] Falling back to Naver Search Snippets for ${brandKey}`);
                const fallbackUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(brandKey + ' 공식홈페이지 특장점')}`;
                await page.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
                const fallbackText = await page.evaluate(() => document.body.innerText);
                const safeFallback = fallbackText.replace(/\s+/g, ' ');
                if (safeFallback.length > 200) {
                   await browser.close();
                   return { text: safeFallback.substring(0, 3000), screenshot: null, rawLength: safeFallback.length };
                }
            } catch(fallbackErr) {}
            
            finalContent = "네이버 보안 방화벽(WAF)에 의해 일시적으로 차단되었습니다.";
            finalLength = 0;
        } else {
            finalContent = finalLength > 50 ? cleanedText.substring(0, 3000) : "데이터가 짧음";
        }
        
        await browser.close();
        return { text: finalContent, screenshot: screenshotUrl, rawLength: finalLength };
    } catch (e) {
        console.error(`Puppeteer failed for ${url}:`, e.message);
        try {
            console.log(`[Crash Fallback] Attempting Naver Snippet survival mode for ${brandKey}`);
            if (!browser || !browser.isConnected()) {
                const retryArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
                if (process.env.SCRAPER_API_KEY) retryArgs.push(`--proxy-server=http://proxy-server.scraperapi.com:8001`);
                
                browser = await puppeteer.launch({ headless: 'new', args: retryArgs });
                
                if (process.env.SCRAPER_API_KEY) {
                    const fallbackPage = await browser.newPage();
                    await fallbackPage.authenticate({ username: 'scraperapi.residential=true', password: process.env.SCRAPER_API_KEY });
                    await fallbackPage.close(); 
                    // Note: In puppeteer, auth is per-page, so we need to auth the newly created page below.
                }
            }
            const fallbackPage = await browser.newPage();
            if (process.env.SCRAPER_API_KEY) {
                await fallbackPage.authenticate({ username: 'scraperapi.residential=true', password: process.env.SCRAPER_API_KEY });
            }
            const fallbackUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(brandKey + ' 공식특장점')}`;
            await fallbackPage.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
            const fallbackText = await fallbackPage.evaluate(() => document.body.innerText);
            await browser.close();
            const safeFb = fallbackText.replace(/\s+/g, ' ');
            if (safeFb.length > 100) return { text: safeFb.substring(0, 3000), screenshot: null, rawLength: safeFb.length };
        } catch(fe) {
            if (browser && browser.isConnected()) await browser.close();
        }
        return { text: "접속 차단됨 또는 타임아웃", screenshot: null, rawLength: 0 };
    }
}

async function findCompetitorUrls(brandName) {
    let browser;
    try {
        const puppeteerArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'];
        if (process.env.SCRAPER_API_KEY) {
            puppeteerArgs.push(`--proxy-server=http://proxy-server.scraperapi.com:8001`);
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: puppeteerArgs
        });
        const page = await browser.newPage();
        
        if (process.env.SCRAPER_API_KEY) {
            await page.authenticate({ username: 'scraperapi.residential=true', password: process.env.SCRAPER_API_KEY });
        }
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const targetUrls = [];
        const searchQueries = [`${brandName} 공식 홈페이지`, `${brandName} 브랜드스토어`];
        
        for (const query of searchQueries) {
            // 해외 검색엔진(구글, DDG)의 부정확성과 CAPTCHA 극복을 위해 네이버 통합검색 결과 직접 파싱
            const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
                const link = await page.evaluate(() => {
                    const anchors = Array.from(document.querySelectorAll('a'));
                    for(let a of anchors) {
                        try {
                            const rawHref = a.href;
                            if (rawHref && rawHref.startsWith('http')) {
                                // 1. 스마트스토어/브랜드스토어 주소 최우선 캐치
                                if (rawHref.includes('smartstore.naver.com') || rawHref.includes('brand.naver.com')) {
                                    return rawHref;
                                }
                                // 2. 네이버 내부 서비스 및 광고 필터링 후 찐 외부 자사몰 캐치
                                if (!rawHref.includes('naver.com') && !rawHref.includes('pstatic.net') && !rawHref.includes('ad.') && !rawHref.includes('namu.wiki')) {
                                    return rawHref;
                                }
                            }
                        } catch(e) {}
                    }
                    return null;
                });
                if (link && !targetUrls.includes(link)) {
                    targetUrls.push(link);
                }
            } catch (innerErr) {
                console.log(`Failed Naver query: ${query}`);
            }
        }
        await browser.close();
        return targetUrls;
    } catch(err) {
        if (browser) await browser.close();
        return [];
    }
}

async function takeSnippetScreenshot(url, targetText, brandKey) {
    if (!url || !targetText || targetText.includes("보안 블라인드")) return null;

    let browser;
    try {
        console.log(`[Sniper Screenshot] Targeting on ${brandKey}: "${targetText.substring(0, 30)}..."`);
        
        const puppeteerArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'];
        if (process.env.SCRAPER_API_KEY) {
            puppeteerArgs.push(`--proxy-server=http://proxy-server.scraperapi.com:8001`);
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: puppeteerArgs
        });
        const page = await browser.newPage();
        
        if (process.env.SCRAPER_API_KEY) {
            await page.authenticate({ username: 'scraperapi.residential=true', password: process.env.SCRAPER_API_KEY });
        }
        
        // 핑거프린팅 완화
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
        
        await page.setViewport({ width: 1280, height: 1024 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 50000 });
        await new Promise(r => setTimeout(r, 1500));

        const success = await page.evaluate(async (textToFind) => {
            const words = textToFind.split(' ').filter(w => w.length > 2);
            if(words.length === 0) return false;
            
            const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, p, span, div, li, td, th'));
            let targetEl = null;

            for (let el of elements) {
                if (el.innerText && el.innerText.includes(words[0])) {
                    let matchCount = 0;
                    for (let w of words) {
                        if (el.innerText.includes(w)) matchCount++;
                    }
                    if (matchCount / words.length > 0.4) {
                        targetEl = el;
                        let children = Array.from(targetEl.children);
                        while(children.length > 0) {
                            let foundDeeper = false;
                            for (let c of children) {
                                if (c.innerText && c.innerText.includes(words[0])) {
                                  targetEl = c;
                                  children = Array.from(targetEl.children);
                                  foundDeeper = true;
                                  break;
                                }
                            }
                            if(!foundDeeper) break;
                        }
                        break;
                    }
                }
            }

            if (targetEl) {
                targetEl.style.border = '6px solid #EF4444'; 
                targetEl.style.backgroundColor = '#FEF2F2';
                targetEl.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
                targetEl.style.padding = '10px';
                targetEl.style.borderRadius = '8px';
                targetEl.scrollIntoView({ behavior: 'instant', block: 'center' });
                return true;
            }
            return false;
        }, targetText);

        if(!success) {
            console.log(`[Sniper Screenshot] text not found on page.`);
            await browser.close();
            return null;
        }

        await new Promise(r => setTimeout(r, 800)); // wait for scroll
        const screenshotDir = path.resolve('public', 'screenshots');
        if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
        
        const safeKey = brandKey ? brandKey.replace(/[^a-zA-Z0-9가-힣]/g, '_') : 'sniper';
        const filename = `sniper_${safeKey}_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotDir, filename);
        
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        await browser.close();
        return `${backendUrl}/screenshots/${filename}`;
    } catch (e) {
        if (browser) await browser.close();
        console.error(`Sniper Screenshot failed:`, e.message);
        return null;
    }
}

export async function generateBenchmarkingReport(keyword, targetUrl, brandName, topCompetitor) {
  // 1. Scraper Node: 자사 URL 소스 획득 시도 (Proxy/Puppeteer 적용)
  const myScrape = await scrapeWithProxyOrPuppeteer(targetUrl, brandName + "_base");
  let myBrandHtml = myScrape.text;
  let myScreenshot = myScrape.screenshot;

  // 2. 경쟁사 URL 동적 크롤링 (Step 2) -> 듀얼 채널(스마트스토어 vs 공식몰) AI 최적화 대결
  let competitorHtml = "";
  let competitorUrl = "";
  let compScreenshot = null;
  
  if (topCompetitor && !topCompetitor.includes(brandName)) {
      const urls = await findCompetitorUrls(topCompetitor);
      if (urls.length > 0) {
          // Promise.all로 투트랙 동시 스크래핑 시도
          const promises = urls.map(async (u, i) => {
              const res = await scrapeWithProxyOrPuppeteer(u, `${topCompetitor}_ch${i}`);
              return { ...res, originalUrl: u };
          });
          const results = await Promise.all(promises);
          
          // 가장 텍스트가 풍부한 곳(rawLength 기준)을 "AI 상위 노출 승자 채널"로 선택
          results.sort((a, b) => b.rawLength - a.rawLength);
          const bestChannel = results[0];
          
          if (bestChannel && bestChannel.rawLength > 100) {
              competitorHtml = bestChannel.text;
              compScreenshot = bestChannel.screenshot;
              competitorUrl = bestChannel.originalUrl;
          } else {
              competitorHtml = "[보안 블라인드] 경쟁사 보안 정책으로 인해 웹 구조 분석이 블라인드 처리되었습니다.";
          }
      } else {
          competitorHtml = "경쟁사 공식 채널(자사몰/스마트스토어) 검색 실패";
      }
  } else {
      competitorHtml = "경쟁사를 특정할 수 없음";
      topCompetitor = "타 대형 브랜드";
  }

  if (!process.env.OPENAI_API_KEY) {
     return {
        key_success_factor: `${topCompetitor}는 하단에 <FAQ> 스키마와 요약된 <table> 구조를 사용하여 AI 가독성이 매우 뛰어납니다.`,
        gap_analysis: `자사(${brandName})는 이미지 통짜로 구성되어 텍스트 데이터가 부족하며, 제품 스펙 관련 수치가 없습니다.`,
        action_plans: [
          {
            step_title: "Step 1: AI 전용 '요약 섹션' 삽입",
            description: "웹사이트 본문 상단이나 하단에 AI가 긁어가기 좋게 3줄 요약을 넣어야 합니다.",
            our_raw_target_sentence: "(데이터 없음)",
            ai_optimized_sentence: "1. 특수 멜트블로운 원단 사용 2. 99.9% 살균력 3. 경제적 롤 타입"
          },
          {
            step_title: "Step 2: 수치 기반 팩트체크 강화",
            description: "추상적인 수식어 대신 강력한 로우데이터(숫자)를 제시해야 AI가 신뢰합니다.",
            our_raw_target_sentence: "잘 닦여요",
            ai_optimized_sentence: "기름때 제거율 98.7% 및 인체 무해 성분 인증"
          }
        ],
        winning_analysis: [
          {
            competitor_name: topCompetitor,
            quoted_sentence: "99.9% 살균력과 멜트블로운 공법의 강력한 마찰력",
            why_it_won: "#구체적수치 #기술명칭 #신뢰도",
            our_counter_strategy: "단순 99.9% 살균을 넘어, 찌든 때 제거율 98.7%를 인체 무해 성분으로 구현한 4세대 세정티슈"
          }
        ]
     };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = `당신은 리버스 엔지니어링 기반의 GEO 전략 분석가입니다. 
당신의 임무는 1위 경쟁사의 스크래핑된 웹페이지 데이터와 우리 브랜드의 데이터를 1:1로 비교하여 팩트 기반의 역공학 가이드를 내는 것입니다.
무작정 경쟁사가 완벽하다고 가정(Hallucination)하여 지어내지 마세요. 주어진 텍스트 데이터만을 기반으로 진단해야 합니다.

[🚨 최고 중요 지침 (모순 제거 및 블라인드 처리)]
1. 만약 경쟁사 데이터가 "[보안 블라인드]" 문구를 포함하고 있다면, 경쟁사 칭찬이나 데이터 분석을 절대 지어내지 마세요.
이 경우 "경쟁사의 높은 보안 정책(WAF)으로 인해 내부 스크래핑이 블라인드 처리되었습니다. 이 경우 경쟁사의 외부 인지도 방어 체계가 단단함을 의미하므로, 자사몰 내부의 수치화된 SEO를 극대화하여 AI에 1순위로 먹여야 합니다." 라고 명확히 서술하세요. (빈 페이지를 보고 '정보가 없어서 좋다'는 헛소리를 하면 절대 안 됩니다.)
2. Action Plan 작성 시 가상의 예시를 지어내지 마세요.
반드시 [자사 웹사이트 스크래핑 텍스트] 원문 중에서 구체적으로 개선해야 할 진짜 문장 영역을 찾아 "our_raw_target_sentence"로 적고, 이를 강력한 수치 기반 "ai_optimized_sentence"로 구조화하세요.
3. [ai_optimized_sentence] 생성 시, 원본 텍스트에 없는 통계를 기계적으로 아무렇게나 붙이지 마세요.
(예를 들어 "180매"라는 제품 스펙에 "99.9% 살균력"을 억지로 이어붙여 "180매당 99.9% 살균" 같은 비논리적인 거짓 문장을 쓰면 절대 안 됩니다.)
만약 원문에 활용할 만한 수치나 통계가 없다면, 숫자를 날조하지 말고 담당 마케터가 추후 진짜 데이터를 기입할 수 있도록 괄호 [O] 기호를 사용하여 템플릿 형태로 제안하세요.
올바른 예시: "잔여물 제거율 [O]% 및 안심 성분 [O]종 인증 획득"
4. [역전 제안 템플릿의 치명적 오류 금지] 자사 웹사이트에 이미 노출되어 있는 정보(가격, 사용자 평점 등)를 "새로 추가하라"고 제안하는 멍청한 짓(Hallucination)을 절대 하지 마십시오.
스크래핑된 본문에 이미 가격이나 리뷰가 있다면 그것을 낡은 방식으로 쓰지 말고 "SEO에 맞게 H2나 Table로 바꾸라"고 하거나, 아예 다른 약점(전문가 인용구 부재 등)을 파고드세요.

[분석 프레임워크: 최신 글로벌 논문 검증 GEO 7대 요소]
당신이 진단할 때 아래 7가지 프레임워크를 기준으로 평가하고 해결책을 제시하세요. 해결책을 제시할 때 괄호 안에 있는 가시성 향상률 수치를 언급하며 마케터를 설득하세요.
1. 통계 및 수치 데이터 추가 (Statistics Addition): 구체적 수치(함량, 가격, 임상 등)가 명시되어 있는지? (적용 시 가시성 30~40% 향상 입증)
2. 출처 명시 및 인용 (Cite Sources): 주장을 뒷받침하는 외부 출처 링크나 '출처:' 텍스트가 있는지? (미적용 사이트가 적용 시 가시성 최대 115.1% 상승 입증)
3. 전문가 인용구 삽입 (Quotation Addition): 관련 전문가나 신뢰할 만한 리뷰어의 직접 속의 인용구(<blockquote>/<q>)가 있는지? (최대 41% 가시성 상승 입증)
4. 유창성 및 평이체 (Fluency & Easy-to-Understand): 복잡한 문장을 매끄럽고 AI가 해석하기 쉬운 구조로 썼는지? (가시성 15~30% 상승 입증)
5. 질문형 제목과 FAQ 구조 (Q&A/FAQ): H2 소제목이 질문형이고 3개 이상의 쌍으로 된 FAQ 섹션이 있는지?
6. 비교표 및 결론 요약 (Table + Bottom Conclusion): <table> 활용 및 표 바로 밑 요약 서술, 문서 맨 밑 요약 구문이 있는지?

[출력 형식]
반드시 아래 JSON 형식으로 반환하세요.
{
  "key_success_factor": "경쟁사의 강점 요약. (블라인드 처리되었다면 '보안 정책으로 블라인드 처리됨'을 명시)",
  "gap_analysis": "자사 웹사이트와의 결정적 차이점. (블라인드 시, 타겟 분석 대신 자사몰 내부 약점 공략에 집중해야 함을 강조)",
  "action_plans": [
    {
      "step_title": "해결책 스텝 제목 (예: Step 1: 두루뭉술한 내용의 통계화)",
      "description": "실무 마케터가 이해할 수 있는 구체적인 수정 이유론",
      "our_raw_target_sentence": "홈페이지 원문에서 찾아낸 교정 대상 텍스트 (Sniper 캡쳐의 타겟이 됩니다)",
      "ai_optimized_sentence": "GEO 프레임워크를 적용한 공격적이고 수치화된 교정 텍스트본"
    }
  ],
  "winning_analysis": [
    {
      "competitor_name": "브랜드명",
      "quoted_sentence": "경쟁사 실제 인용 문구 (블라인드 처리되었거나 내용이 없으면 '[경쟁사 봇 방어막으로 차단됨]'으로 작성할 것)",
      "why_it_won": "블라인드 된 경우, '강력한 봇 탐지 방어막(WAF)으로 인해 내부 구조 확인이 불가능합니다. 하지만 역으로 우리가 자사몰의 내부 SEO 최적화를 극대화한다면 AI의 정보 수집을 독점하여 손쉽게 순위를 역전할 기회가 됩니다.' 라고 고정출력하세요. (개인 정보 보호 정책을 강화하라는 등 얼토당토않은 헛소리 절대 금지). 블라인드가 아니라면 기존대로 GEO 7대 요소에 기반한 상세 분석을 작성하세요.",
      "our_counter_strategy": "블라인드 된 경우, 자사 웹사이트 스크래핑 텍스트에서 가장 부족한 약점(통계 부재 등)을 꼬집으며 '경쟁사를 신경 쓰지 말고, 우선 우리 웹사이트의 이 취약한 문장부터 수치 기반으로 뜯어고칩시다: [수정된 문구 제안]' 형식으로 출력하세요. (웹사이트 보안/데이터 정책 강화를 제안하는 환각 절대 금지). 블라인드가 아닐 경우 기존대로 초정밀 카운터 문구를 작성하세요."
    }
  ]
}`;

  const userPrompt = `
[검색 키워드]: ${keyword}

[자사 브랜드]: ${brandName} (URL: ${targetUrl})
[자사 웹사이트 스크래핑 텍스트]:
${myBrandHtml}

[비교 대상 경쟁사]: ${topCompetitor} ${competitorUrl ? `(URL: ${competitorUrl})` : ''}
[경쟁사 웹사이트 스크래핑 텍스트]:
${competitorHtml}

위 두 웹사이트의 실제 텍스트 데이터를 기반으로 비교 분석하세요.
다시 한번 강조하지만, 경쟁사의 텍스트 수준이 빈약한데 "다양한 정보 제공", "정보를 잘 전달함" 이라는 거짓말(Hallucination)을 절대로 쓰면 안 됩니다. 부족하면 부족하다고 팩트를 짚어주고 이것을 기회로 살리는 마케팅 관점의 리포트를 도출하세요.
`;

  try {
    const rawResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    
    const responseString = rawResponse.choices[0].message.content;
    const result = JSON.parse(responseString);
    
    // 파싱 성공 시 (에러 안남) 로깅 (비동기로 실행되므로 await 안해도 좋음, 블로킹 방지)
    import('../utils/datasetLogger.js').then(({ appendDatasetLog }) => {
       appendDatasetLog(systemPrompt, userPrompt, responseString);
    }).catch(err => console.error("Logger import failed:", err));
    
    // Sniper Screenshot Pass 2: 투-패스 정밀 캡쳐
    console.log(`[Sniper Orchestrator] Running sniper captures...`);
    let finalOurScreenshot = myScreenshot;
    let finalCompScreenshot = compScreenshot;

    if (result.action_plans && result.action_plans.length > 0) {
        const targetOurText = result.action_plans[0].our_raw_target_sentence;
        if (targetOurText && targetOurText.length > 5) {
            const snipedOur = await takeSnippetScreenshot(targetUrl, targetOurText, 'our_sniper');
            if (snipedOur) finalOurScreenshot = snipedOur;
        }
    }

    if (result.winning_analysis && result.winning_analysis.length > 0 && competitorUrl) {
        const targetCompText = result.winning_analysis[0].quoted_sentence;
        if (targetCompText && targetCompText.length > 5) {
            const snipedComp = await takeSnippetScreenshot(competitorUrl, targetCompText, 'comp_sniper');
            if (snipedComp) finalCompScreenshot = snipedComp;
        }
    }
    
    // Front-end로 스크린샷 뷰 전송
    result.our_screenshot = finalOurScreenshot;
    result.competitor_screenshot = finalCompScreenshot;
    
    return result;
  } catch (error) {
    console.error("Benchmarking error:", error);
    return null;
  }
}
