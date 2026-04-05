// 프론트엔드(React) 웹페이지(localhost:3000 등)에 주입되는 스크립트

// 1. React 앱에서 보낸 메시지(GEO_START_SCRAPE)를 리스닝
window.addEventListener("message", function(event) {
  // 보안 및 타임아웃 필터
  if (event.source !== window || !event.data || event.data.type !== "GEO_START_SCRAPE") {
    return;
  }

  const keyword = event.data.keyword;
  console.log("[Content Script] 받은 텍스트 크롤링 요청:", keyword);

  // 2. 익스텐션 백그라운드로 메시지 릴레이
  chrome.runtime.sendMessage({ action: "SCRAPE_NAVER", keyword: keyword }, function(response) {
    if (chrome.runtime.lastError) {
      console.error("[Content Script] Background 연동 에러:", chrome.runtime.lastError);
      window.postMessage({ type: "GEO_SCRAPE_ERROR", error: "EXTENSION_ERROR" }, "*");
      return;
    }

    console.log("[Content Script] 백그라운드 크롤링 완료, React로 전송합니다");
    window.postMessage({
      type: "GEO_SCRAPE_RESULT",
      data: response.data
    }, "*");
  });
});

// React가 초기 로드될 때 익스텐션 설치 여부를 알 수 있도록 핑 퐁
window.addEventListener("message", function(event) {
  if (event.source === window && event.data && event.data.type === "GEO_PING") {
    window.postMessage({ type: "GEO_PONG", status: "INSTALLED" }, "*");
  }
});
