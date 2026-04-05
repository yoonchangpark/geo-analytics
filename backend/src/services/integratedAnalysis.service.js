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

  const trueWinnerWarning = trueWinnerName ? `
[🚨 핵심 경고 사항 🚨]
현재 입력된 자사 및 타겟 경쟁사들은 AI 인용 점유율에서 거의 전멸(패배)했습니다. 
대신 AI가 원문 답변에서 1위로 추천한 "진짜 승자(True Winner)"는 바로 '${trueWinnerName}' 입니다.
반드시 이 사실을 분석에 포함하여, 왜 기존 브랜드들이 소외되고 해당 브랜드가 AI의 선택을 받았는지 강력하게 경고하세요.` : '';

  const userPrompt = `
[입력 데이터]
1. 키워드: ${keyword}
2. 네이버 검색량 데이터 (연관도/수요): ${JSON.stringify(searchData)}
3. GEO 분석 결과 (Local AI 인용 점유율): ${JSON.stringify(geoResult)}

[요구사항]
위 데이터를 바탕으로 '전통적 검색 점유율(검색량/수요)'과 'AI 인용 점유율(GEO 비율)'의 격차를 분석하세요.
특히, 특정 브랜드가 검색량은 높은데 AI 인용 점유율이 0%에 수렴하거나 부족한 경우 그 기술적/마케팅적 이유(예: 기술적 SEO 부족, 구조화 데이터 부재, 사용자 리뷰 UGC 부족 등)를 지적하세요. 반대인 경우(검색량은 낮은데 GEO가 높음)도 분석하세요.
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
      temperature: 0.2, // 좀 더 날카로운 분석을 위해 낮춤
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
