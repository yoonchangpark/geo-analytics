import { OpenAI } from 'openai';

export async function analyzeSearchDominance(keyword, searchData, geoResult, trueWinnerName = null) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-api-key-for-local' 
  });

  if (!process.env.OPENAI_API_KEY) {
    return {
      message: "통합 분석 결과 (Mock)",
      urgent_actions: [
        { 
          title: "웹 구조 통계/수치화 적용", 
          description: "[현재 문장] 우리 제품은 세정력이 좋습니다. -> [수정 제안] 자체 임상 결과 기름때 제거율 98.7%를 검증받은 4세대 세정 기술을 적용했습니다." 
        },
        { 
          title: "UGC 리뷰 인용구(Quotation) 전환", 
          description: "[현재 문장] 많은 고객들이 만족합니다. -> [수정 제안] <q>3개월째 사용 중인데 성분이 착해서 아이 방에도 안심하고 써요 - 네이버 베스트 리뷰어</q>" 
        },
        { 
          title: "FAQ 질문형(H2) 소제목 배치", 
          description: "[현재 문장] 제품 스펙 및 상세정보 -> [수정 제안] H2: 세정티슈 구매 시 가장 중요한 살균력은 어느 정도인가요?" 
        }
      ]
    };
  }

  let trueWinnerWarning = ''; // Will be populated after math verification

  // 🚨 LLM Hallucination (숫자 오판 및 모순) 방지를 위한 자바스크립트 사전 계산 로직 탑재
  let preciseQuadrantLock = "각 브랜드별 사분면 지표 (당신은 이 수학적 분류값을 절대적으로 신뢰해야 하며 반대로 말해선 안 됩니다):\n";
  if (Array.isArray(geoResult) && searchData) {
      const avgSearchVol = Object.values(searchData).reduce((sum, data) => sum + (data.searchVolume || 0), 0) / (Object.keys(searchData).length || 1);
      
      geoResult.forEach(item => {
         const brand = item.name;
         const geoShare = item.value; // %
         const sv = searchData[brand]?.searchVolume || 0;
         
         let quadrant = "";
         if (sv > avgSearchVol && geoShare >= 20) quadrant = "[고수요-고가시성] 검색 수요도 높고 AI 점유율도 훌륭한 마켓 리더 확보 상태";
         else if (sv > avgSearchVol && geoShare < 20) quadrant = "[고수요-저가시성] 🚨위험: 네이버 검색량 인지도는 높으나, AI 최적화(GEO) 태만으로 AI 추천에서 밀려나 타 브랜드에게 파이를 뺏기고 있음";
         else if (sv <= avgSearchVol && geoShare >= 20) quadrant = "[저수요-고가시성] 💎초고효율: 네이버 순수 검색량은 타겟보다 낮지만, 기술적/마케팅적 SEO 최적화가 완벽해 AI의 선택을 독점, 대형 브랜드를 역으로 압도함 (매우 훌륭함)";
         else quadrant = "[저수요-저가시성] 검색량도 낮고 AI 점유율도 낮아 총체적 개선 필요";
         
         preciseQuadrantLock += `- 브랜드: ${brand} (검색량: ${sv}, AI 점유율: ${geoShare}%) -> 【강제 분류 결과: ${quadrant}】\n`;
      });
      
      const highestShare = Math.max(...geoResult.map(i => i.value));
      const mathWinner = geoResult.find(i => i.value === highestShare)?.name || "없음";
      preciseQuadrantLock += `\n[절대 규칙] 수학적 팩트에 따라 AI 점유율이 가장 높은 최종 1위 승자는 '${mathWinner}'입니다. 분석 코멘트 작성 시 절대로 다른 브랜드를 승자로 지칭하지 마세요.\n`;
      
      // 수학적 검증: 만약 AI가 예측한 trueWinnerName이 수학적 1위(mathWinner)와 다르다면, 예측 과정의 환각(Hallucination)이므로 경고를 폐기함.
      if (trueWinnerName && trueWinnerName === mathWinner) {
         trueWinnerWarning = `\n[🚨 핵심 경고 사항 🚨]\n초기 분석 결과 기존 경쟁사들은 패배하였고 현재 수학적 1위를 차지한 진짜 승자(True Winner)는 바로 '${trueWinnerName}' 입니다. 왜 해당 브랜드가 AI의 선택을 독점하고 있는지 분석에 강조하세요.`;
      }
  }

  const userPrompt = `
[입력 데이터]
${trueWinnerWarning}
1. 키워드: ${keyword}
2. 사전 계산 알고리즘의 확정된 팩트 데이터:
${preciseQuadrantLock}

[요구사항]
위 팩트 데이터를 바탕으로 '전통적 검색 점유율(검색량/수요)'과 'AI 인용 점유율(GEO 비율)'의 상관관계를 통찰하세요.
절대로 '[저수요-고가시성]'으로 분류된 효율적인 브랜드를 두고 "AI의 선택에서 소외되었다" 거나 "점유율이 낮다"는 식의 거짓말(Hallucination)을 하지 마십시오. 자바스크립트가 넘겨준 【강제 분류 결과】의 맥락을 그대로 따르십시오.
${trueWinnerWarning}

[출력 포맷]
반드시 아래 JSON 형식으로 반환하세요.
{
  "analysis_insight": "각 브랜드들의 검색량 vs AI가시성에 대한 2~3줄 요약 통찰",
  "urgent_actions": [
    {
      "title": "행동 지침 제목 (예: 스키마 마크업 삽입)",
      "description": "실제 이유 및 상세 해결 가이드 1문장"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are an elite B2B SEO/GEO Growth Hacker parsing data.' },
        { role: 'user', content: userPrompt }
      ]
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("analyzeSearchDominance error:", error);
    return null;
  }
}
