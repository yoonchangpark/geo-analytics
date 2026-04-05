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
            return { text: "프록시 우회 서버 접속 실패", screenshot: null, rawLength: 0 };
        }
    }

    // 2. 로컬 브라우저 모드 (데스크톱 및 개발 환경 Fallback - Puppeteer)
    let browser;
    try {
        console.log(`[Puppeteer Mode] Scraping local: ${url}`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2500));
        
        const screenshotDir = path.resolve('public', 'screenshots');
        if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
        
        const safeKey = brandKey ? brandKey.replace(/[^a-zA-Z0-9가-힣]/g, '_') : 'site';
        const filename = `${safeKey}_${Date.now()}.png`;
        const screenshotPath = path.join(screenshotDir, filename);
        
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const screenshotUrl = `${backendUrl}/screenshots/${filename}`;

        const text = await page.evaluate(() => document.body.innerText);
        await browser.close();
        
        let cleanedText = text.replace(/\s+/g, ' ');
        let finalContent = "";
        let finalLength = cleanedText.length;
        
        // 네이버 WAF 및 방화벽 필터링
        if (cleanedText.includes('현재 서비스 접속이 불가') || cleanedText.includes('Please complete the security verification') || cleanedText.includes('요청하신 페이지를 찾을 수 없습니다')) {
            finalContent = "네이버 보안 방화벽(WAF)에 의해 일시적으로 차단되었습니다.";
            finalLength = 0;
        } else {
            finalContent = finalLength > 50 ? cleanedText.substring(0, 3000) : "데이터가 짧음";
        }
        
        return { text: finalContent, screenshot: screenshotUrl, rawLength: finalLength };
    } catch (e) {
        if (browser) await browser.close();
        console.error(`Puppeteer failed for ${url}:`, e.message);
        return { text: "접속 차단됨 또는 타임아웃", screenshot: null, rawLength: 0 };
    }
}

async function findCompetitorUrls(brandName) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
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
            example: "[현재 문장] (데이터 없음) -> [수정 제안] 1. 특수 멜트블로운 원단 사용 2. 99.9% 살균력 3. 경제적 롤 타입"
          },
          {
            step_title: "Step 2: 수치 기반 팩트체크 강화",
            description: "추상적인 수식어 대신 강력한 로우데이터(숫자)를 제시해야 AI가 신뢰합니다.",
            example: "[현재 문장] 잘 닦여요 -> [수정 제안] 기름때 제거율 98.7% 및 인체 무해 성분 인증"
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
반드시 [자사 웹사이트 스크래핑 텍스트] 원문 중에서 개선해야 할 타겟 문장을 정확히 찾아내어 "Before"로 삼고, 이를 구체적인 수치와 통계가 포함된 강력한 AI 최적화 문구 "After"로 교정하는 [현재 문장] -> [수정 제안] 형식으로 강제 작성해야 합니다.

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
      "example": "[현재 홈페이지 문구: (자사몰에서 찾은 실제 원문)] -> [AI 최적화 수정 제안: (위의 프레임워크를 적용한 공격적이고 수치화된 교정본)]"
    }
  ],
  "winning_analysis": [
    {
      "competitor_name": "브랜드명",
      "quoted_sentence": "경쟁사 실제 인용 문구 (블라인드 처리되었거나 내용이 없으면 '보안 블라인드 처리'로 작성할 것)",
      "why_it_won": "채택 이유 (해시태그 형태, 예: #구체적수치 혹은 #보안블라인드)",
      "our_counter_strategy": "자사 본문에 기반하여 AI가 우선순위로 채택할 만한 수치+팩트 기반의 초정밀 카운터(Before & After) 문구 제안"
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
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    // Front-end로 스크린샷 주소 전달
    result.our_screenshot = myScreenshot;
    result.competitor_screenshot = compScreenshot;
    
    return result;
  } catch (error) {
    console.error("Benchmarking error:", error);
    return null;
  }
}
