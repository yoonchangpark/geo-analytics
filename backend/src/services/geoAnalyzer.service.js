import { OpenAI } from 'openai';

// 1. 브랜드 점유율 분석 엔진 (Regex Native) - PAWC 알고리즘
export async function analyzeBrandShare(aiAnswer, targetBrands, userInput, engine = 'global') {
  if (!aiAnswer || typeof aiAnswer !== 'string') return null;

  const totalLength = aiAnswer.length;
  if (totalLength === 0) return null;

  const rawScores = {};
  targetBrands.forEach(brand => {
    rawScores[brand] = { mentions: 0, weightedScore: 0 };
    
    let startIndex = 0;
    const lowerAnswer = aiAnswer.toLowerCase();
    const lowerBrand = brand.toLowerCase();
    
    // 정규식 대신 빠른 indexOf 검색 기반 PAWC 수학적 가중치 연산
    while ((startIndex = lowerAnswer.indexOf(lowerBrand, startIndex)) > -1) {
      rawScores[brand].mentions += 1;
      
      const positionPct = startIndex / totalLength;
      let weight = 0.7; // default for > 60%
      if (positionPct <= 0.2) weight = 1.5;
      else if (positionPct <= 0.6) weight = 1.0;

      // 네이버 익스텐션 특화 UGC 가중치 로직
      if (engine === 'naver') {
         const localContext = lowerAnswer.substring(Math.max(0, startIndex - 30), Math.min(totalLength, startIndex + 30));
         if (localContext.includes('추천') || localContext.includes('블로그') || localContext.includes('후기')) {
            weight *= 1.5;
         }
      }
      
      rawScores[brand].weightedScore += weight;
      startIndex += lowerBrand.length;
    }
  });

  // 전체 가중치 합산 대비 백분율(%) 산출
  const totalScore = Object.values(rawScores).reduce((acc, curr) => acc + curr.weightedScore, 0);

  let market_share = targetBrands.map(brand => {
    const raw = rawScores[brand];
    const share_percent = totalScore > 0 ? (raw.weightedScore / totalScore) * 100 : 0;
    return {
      brand: brand,
      share_percent: Number(share_percent.toFixed(1)),
      mention_count: raw.mentions
    };
  });

  // 순위 정렬
  market_share.sort((a, b) => b.share_percent - a.share_percent);
  market_share.forEach((item, idx) => item.rank = idx + 1);

  const bestBrand = market_share[0]?.brand || "측정 불가";
  const analysis_summary = totalScore > 0 
      ? `현재 AI 모델 답변 내에서 ${bestBrand} 브랜드가 가장 높은 인용 가중치(${market_share[0].share_percent}%)를 획득했습니다.`
      : `추적 중인 타겟 브랜드들이 AI 답변 본문에 전혀 노출되지 않았습니다.`;

  return {
    keywords: userInput,
    market_share: market_share,
    analysis_summary: analysis_summary
  };
}

// 2. 비결정론적 오차 제거 (Loop & Average) 자바스크립트 네이티브 파이프라인
export async function aggregateShareResultsLLM(loopResults) {
  if (!loopResults || loopResults.length === 0) return null;

  const brandDict = {};
  
  loopResults.forEach(res => {
     if(!res.market_share) return;
     res.market_share.forEach(item => {
        if (!brandDict[item.brand]) {
           brandDict[item.brand] = { totalShare: 0, totalMentions: 0, appearCount: 0 };
        }
        brandDict[item.brand].totalShare += item.share_percent;
        brandDict[item.brand].totalMentions += item.mention_count;
        if (item.mention_count > 0) brandDict[item.brand].appearCount += 1;
     });
  });

  const loopCount = loopResults.length;
  const final_shares = Object.keys(brandDict).map(brand => {
      const data = brandDict[brand];
      const avgShare = data.totalShare / loopCount;
      const pawcScore = avgShare * 2; 
      const consistency = (data.appearCount / loopCount) * 100;

      return {
          brand: brand,
          avg_share: Number(avgShare.toFixed(1)),
          avg_mentions: Number((data.totalMentions / loopCount).toFixed(1)),
          pawc_score: Number(pawcScore.toFixed(1)),
          consistency_score: Number(consistency.toFixed(1))
      };
  });

  // 점유율 기준 내림차순 정렬
  final_shares.sort((a, b) => b.avg_share - a.avg_share);

  const top_competitor = final_shares.length > 0 && final_shares[0].avg_share > 0 ? final_shares[0].brand : "측정불가";
  const tcData = final_shares.find(s => s.brand === top_competitor) || { avg_mentions: 0, pawc_score: 0, consistency_score: 0 };
  
  return {
    final_shares: final_shares,
    top_competitor: top_competitor,
    top_reasons: [
      `자바스크립트 기반 표적 추적 결과, ${top_competitor} 브랜드는 전체 모델 추천 과정에서 평균 ${tcData.avg_mentions}번 노출되며 가장 독보적인 언급 빈도를 보였습니다.`,
      `키워드 밀착 알고리즘(PAWC) 가중치를 연산한 결과, 최고점인 ${tcData.pawc_score}점을 획득하여 다른 브랜드 대비 위치적(상단) 우위를 점했습니다.`
    ],
    action_tip: "자사 브랜드 역시 긍정적 텍스트와 함께 AI 요약문 최상단에 노출되도록 SEO를 개편해야 합니다."
  };
}

// 💡 Data Mapper (Node 2 - Code): 추출된 JSON 데이터를 받아 Recharts 파이 차트용으로 단순 정규화 (Normalization)
export function mapToFrontendPieChart(finalSharesData) {
  if (!finalSharesData || !finalSharesData.final_shares) return [];
  
  // Return format suitable for Recharts PieChart Component, plus include the raw details
  return finalSharesData.final_shares.map(item => ({
    name: item.brand,
    value: item.avg_share || 0,
    mentions: item.avg_mentions !== undefined ? item.avg_mentions : 0,
    pawc_score: item.pawc_score !== undefined ? item.pawc_score : 0
  }));
}

// Orchestrator: 전체 점유율 분석 파이프라인
export async function runGeoShareAnalysis(textAnswers, targetBrands, keyword, engine = 'global') {
  // 1. 개별 답변 당 브랜드 점유율 분석 수행 (PAWC 적용)
  const rawAnalysesPromises = textAnswers.map(answer => analyzeBrandShare(answer, targetBrands, keyword, engine));
  const rawAnalyses = await Promise.all(rawAnalysesPromises);
  
  const validLoopResults = rawAnalyses.filter(r => r !== null);
  
  if (validLoopResults.length === 0) {
    return { pieChartData: [], rawData: null };
  }

  // 2. 비결정론적 오차 제거를 위한 Loop 결과 통합
  const aggregatedResult = await aggregateShareResultsLLM(validLoopResults);

  // 3. (Code Mapper) 프론트엔드 전송을 위한 PieChart Data 정제
  const pieChartData = mapToFrontendPieChart(aggregatedResult);

  return {
    aggregatedResult,
    pieChartData,
    rawAnalyses: validLoopResults
  };
}

// 3. 자사 및 타겟 경쟁사 전멸 시 실제 우승자(True Winner) 추출기
export async function findTrueWinnerBrand(aiAnswerText) {
  if (!process.env.OPENAI_API_KEY) return '피죤'; // Mock Data

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `다음은 AI 검색엔진의 반환 결과 텍스트입니다:
---
${aiAnswerText}
---
위 텍스트에서 가장 강하게 긍정적으로 혹은 빈번하게 추천된 "특정 1위 브랜드(고유명사)" 딱 1개만 추출하세요. 
일반 명사(예: 세정기, 거품, 특징 등)나 문장은 제외하세요.
반환 형식은 다른 수식어 없이 순수하게 해당 브랜드 명칭 단 1개만 출력하세요. (예: 다우니)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim().replace(/['"]/g, '');
  } catch (err) {
    console.error("findTrueWinnerBrand error:", err);
    return null;
  }
}
