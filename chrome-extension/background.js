// Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE_NAVER") {
    const keyword = request.keyword;
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;

    // 1. 네이버 탭 활성화 없이 백그라운드 탭 생성 (활성화: false)
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      const tabId = tab.id;

      // 2. 탭에 스크립트 강제 주입 후 실행 결과를 받기 (15초 내에 처리)
      const executeScraping = () => {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: scrapeNaverContent
        }, (results) => {
          // 크롤링 종료 후 백그라운드 탭 강제 닫기
          chrome.tabs.remove(tabId);
          
          if (chrome.runtime.lastError || !results || !results[0]) {
            sendResponse({ data: null, error: 'Scraping timeout or error.' });
            return;
          }
          
          // 성공 시 텍스트 반환
          sendResponse({ data: results[0].result });
        });
      };

      // 탭 로딩 완료 기다림
      chrome.tabs.onUpdated.addListener(function listener(tId, changeInfo) {
        if (tId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          // DOM 트리가 다 채워지도록 2초 정도 딜레이 (스마트블록, 뷰)
          setTimeout(executeScraping, 2000);
        }
      });
      
      // 혹시라도 탭이 안닫힐까봐 강제 타임아웃
      setTimeout(() => {
          try { chrome.tabs.remove(tabId); } catch(e){}
      }, 15000);
      
    });

    return true; // 비동기 응답 처리(SendResponse)를 위해 true 반환 필수
  }
});

// 이 함수 안에 들어가는 코드는 타겟 브라우저 탭(네이버)의 Context 위에서 실행됨
function scrapeNaverContent() {
  try {
    const container = document.querySelector('#main_pack');
    if (!container) return "네이버 검색 결과 파싱 불가 (DOM 변경됨)";
    
    // 파워링크, 브랜드 검색 등 텍스트를 잡아먹는 상단 광고 노드 강제 삭제 유도
    const adSelectors = ['.power_link', '.sp_power', '.brand_search', '.list_shop', '.power_contents'];
    adSelectors.forEach(sel => {
       const ads = container.querySelectorAll(sel);
       ads.forEach(ad => { try { ad.remove() } catch(e){} });
    });

    // 불필요 공백 제거
    const rawText = container.innerText.replace(/\s+/g, ' ');
    
    // 이전의 3000자 제한을 15,000자로 대폭 완화하여 본문(블로그/지식iN/VIEW)까지 충분히 검색되도록 조치
    return rawText.substring(0, 15000);
  } catch (err) {
    return "Error during scraping: " + err.message;
  }
}
